import type { D1Database } from "../market-history/types";
import type { ApiFootballTeamContext, NewsArticle } from "../../types/market";
import type { SignalDataCollectionRun, SignalDataReadOptions, SignalDataRepository } from "./types";

interface NewsArticleRow {
  id: string;
  title: string;
  url: string;
  source: string | null;
  published_at: string | null;
  language: string | null;
  matched_team_ids: string;
  matched_keywords: string;
  snippet: string | null;
}

interface FootballContextRow {
  profile_json: string;
  fixtures_json: string;
}

interface NewsStatsRow {
  count: number;
  latest_collected_at: string | null;
  latest_published_at: string | null;
}

interface FootballStatsRow {
  count: number;
  latest_collected_at: string | null;
}

interface CollectionRunRow {
  id: string;
  source: string;
  collected_at: string;
  count: number;
  status: string;
  errors_json: string | null;
}

export function createD1SignalDataRepository(database: D1Database): SignalDataRepository {
  return {
    async upsertNewsArticles(articles: NewsArticle[], collectedAt: string): Promise<void> {
      if (articles.length === 0) {
        return;
      }

      await database.batch(
        articles.map((article) =>
          database
            .prepare(
              `INSERT INTO news_articles (
                id,
                title,
                url,
                source,
                published_at,
                language,
                matched_team_ids,
                matched_keywords,
                snippet,
                collected_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                source = excluded.source,
                published_at = excluded.published_at,
                language = excluded.language,
                matched_team_ids = excluded.matched_team_ids,
                matched_keywords = excluded.matched_keywords,
                snippet = excluded.snippet,
                collected_at = excluded.collected_at`,
            )
            .bind(
              article.id,
              article.title,
              article.url,
              article.source ?? null,
              article.publishedAt ?? null,
              article.language ?? null,
              JSON.stringify(article.matchedTeamIds),
              JSON.stringify(article.matchedKeywords),
              article.snippet ?? null,
              collectedAt,
            ),
        ),
      );
    },

    async readNewsArticles(options: SignalDataReadOptions = {}): Promise<NewsArticle[]> {
      const bindings: Array<string | number> = [];
      const clauses: string[] = [];

      if (options.teamId) {
        clauses.push("matched_team_ids LIKE ?");
        bindings.push(`%"${options.teamId}"%`);
      }

      const cutoff = getCutoffIso(options.days);

      if (cutoff) {
        clauses.push("(published_at IS NULL OR published_at >= ?)");
        bindings.push(cutoff);
      }

      const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
      const limit = Math.max(1, Math.min(options.limit ?? 80, 200));
      const result = await database
        .prepare(
          `SELECT
            id,
            title,
            url,
            source,
            published_at,
            language,
            matched_team_ids,
            matched_keywords,
            snippet
          FROM news_articles
          ${where}
          ORDER BY COALESCE(published_at, collected_at) DESC
          LIMIT ?`,
        )
        .bind(...bindings, limit)
        .all<NewsArticleRow>();

      return (result.results ?? []).map(mapNewsRow);
    },

    async upsertFootballTeamContext(context: ApiFootballTeamContext[], collectedAt: string): Promise<void> {
      if (context.length === 0) {
        return;
      }

      await database.batch(
        context.map((teamContext) =>
          database
            .prepare(
              `INSERT INTO football_team_context (
                team_id,
                profile_json,
                fixtures_json,
                collected_at
              ) VALUES (?, ?, ?, ?)
              ON CONFLICT(team_id) DO UPDATE SET
                profile_json = excluded.profile_json,
                fixtures_json = excluded.fixtures_json,
                collected_at = excluded.collected_at`,
            )
            .bind(
              teamContext.profile.teamId,
              JSON.stringify(teamContext.profile),
              JSON.stringify({
                fixtures: teamContext.fixtures,
                squad: teamContext.squad,
                injuries: teamContext.injuries,
                standings: teamContext.standings,
                odds: teamContext.odds,
                dataIssues: teamContext.dataIssues,
              }),
              collectedAt,
            ),
        ),
      );
    },

    async readFootballTeamContext(options: { teamId?: string } = {}): Promise<ApiFootballTeamContext[]> {
      const result = options.teamId
        ? await database
            .prepare(
              `SELECT profile_json, fixtures_json
              FROM football_team_context
              WHERE team_id = ?
              ORDER BY collected_at DESC`,
            )
            .bind(options.teamId)
            .all<FootballContextRow>()
        : await database
            .prepare(
              `SELECT profile_json, fixtures_json
              FROM football_team_context
              ORDER BY collected_at DESC`,
            )
            .all<FootballContextRow>();

      return (result.results ?? []).map(mapFootballContextRow);
    },

    async recordCollectionRun(run: SignalDataCollectionRun): Promise<void> {
      await database
        .prepare(
          `INSERT INTO collection_runs (
            id,
            source,
            collected_at,
            count,
            status,
            errors_json
          ) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            count = excluded.count,
            status = excluded.status,
            errors_json = excluded.errors_json`,
        )
        .bind(
          run.id,
          run.source,
          run.collectedAt,
          run.count,
          run.status,
          run.errors ? JSON.stringify(run.errors) : null,
        )
        .run();
    },

    async readSourceStats() {
      const [newsResult, footballResult, runResult] = await Promise.all([
        database
          .prepare(
            `SELECT
              COUNT(*) AS count,
              MAX(collected_at) AS latest_collected_at,
              MAX(published_at) AS latest_published_at
            FROM news_articles`,
          )
          .all<NewsStatsRow>(),
        database
          .prepare(
            `SELECT
              COUNT(*) AS count,
              MAX(collected_at) AS latest_collected_at
            FROM football_team_context`,
          )
          .all<FootballStatsRow>(),
        database
          .prepare(
            `SELECT
              id,
              source,
              collected_at,
              count,
              status,
              errors_json
            FROM collection_runs
            WHERE source IN ('gdelt', 'api-football')
            ORDER BY collected_at DESC
            LIMIT 8`,
          )
          .all<CollectionRunRow>(),
      ]);
      const news = newsResult.results?.[0];
      const football = footballResult.results?.[0];
      const runs = (runResult.results ?? []).map(mapCollectionRunRow);
      const newsLastRun = runs.find((run) => run.source === "gdelt");
      const footballLastRun = runs.find((run) => run.source === "api-football");

      return {
        news: {
          count: news?.count ?? 0,
          latestCollectedAt: news?.latest_collected_at ?? undefined,
          latestPublishedAt: news?.latest_published_at ?? undefined,
          lastRun: newsLastRun,
        },
        football: {
          count: football?.count ?? 0,
          latestCollectedAt: football?.latest_collected_at ?? undefined,
          lastRun: footballLastRun,
        },
      };
    },
  };
}

function mapCollectionRunRow(row: CollectionRunRow): SignalDataCollectionRun {
  return {
    id: row.id,
    source: row.source === "api-football" ? "api-football" : "gdelt",
    collectedAt: row.collected_at,
    count: row.count,
    status: isRunStatus(row.status) ? row.status : "error",
    errors: row.errors_json ? parseJsonArray(row.errors_json) : undefined,
  };
}

function mapNewsRow(row: NewsArticleRow): NewsArticle {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    source: row.source ?? undefined,
    publishedAt: row.published_at ?? undefined,
    language: row.language ?? undefined,
    matchedTeamIds: parseJsonArray(row.matched_team_ids),
    matchedKeywords: parseJsonArray(row.matched_keywords),
    snippet: row.snippet ?? undefined,
  };
}

function mapFootballContextRow(row: FootballContextRow): ApiFootballTeamContext {
  const contextPayload = parseFootballContextPayload(row.fixtures_json);
  const parsed = {
    profile: JSON.parse(row.profile_json) as ApiFootballTeamContext["profile"],
  } as Partial<ApiFootballTeamContext>;

  return {
    profile: parsed.profile as ApiFootballTeamContext["profile"],
    fixtures: contextPayload.fixtures,
    squad: contextPayload.squad,
    injuries: contextPayload.injuries,
    standings: contextPayload.standings,
    odds: contextPayload.odds,
    dataIssues: contextPayload.dataIssues,
  };
}

function parseFootballContextPayload(value: string): Omit<ApiFootballTeamContext, "profile"> {
  const parsed = JSON.parse(value) as unknown;

  if (Array.isArray(parsed)) {
    return {
      fixtures: parsed as ApiFootballTeamContext["fixtures"],
      squad: [],
      injuries: [],
      standings: [],
      odds: [],
      dataIssues: [],
    };
  }

  const payload = parsed as Partial<Omit<ApiFootballTeamContext, "profile">>;

  return {
    fixtures: payload.fixtures ?? [],
    squad: payload.squad ?? [],
    injuries: payload.injuries ?? [],
    standings: payload.standings ?? [],
    odds: payload.odds ?? [],
    dataIssues: payload.dataIssues ?? [],
  };
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function isRunStatus(value: string): value is SignalDataCollectionRun["status"] {
  return value === "ok" || value === "empty" || value === "error" || value === "skipped";
}

function getCutoffIso(days: number | undefined): string | undefined {
  if (!days || days <= 0) {
    return undefined;
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}
