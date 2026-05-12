import type { D1Database } from "../market-history/types";
import type { ApiFootballTeamContext, NewsArticle } from "../../types/market";
import type { SignalDataReadOptions, SignalDataRepository } from "./types";

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

function getCutoffIso(days: number | undefined): string | undefined {
  if (!days || days <= 0) {
    return undefined;
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}
