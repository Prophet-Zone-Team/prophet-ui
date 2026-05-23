import { apiFootballTeamConfig } from "../../config/api-football-team-config";
import {
  WORLD_CUP_CONTEXT_KEYWORDS,
  getTeamNewsQueryConfig,
} from "../../config/team-news-query-config";
import { worldCupTeams } from "../../data/teams/world-cup-teams";
import { getApiFootballTeamContext } from "../../data/football/api-football-provider";
import { gdeltNewsProvider } from "../../data/news/gdelt-news-provider";
import type { TeamNewsQuery } from "../../data/news/types";
import type { ApiFootballTeamContext, NewsArticle, Team } from "../../types/market";
import { getSignalDataRepository } from "./repository";

const NEWS_LOOKBACK_DAYS = 30;
const MAX_ARTICLES_PER_TEAM = 12;
const API_FOOTBALL_TEAMS_PER_RUN = 1;
const GDELT_TEAM_BATCHES_PER_RUN = 1;
const GDELT_TEAMS_PER_QUERY = 6;
const GDELT_MIN_RUN_INTERVAL_MS = 60 * 60 * 1000;
const GDELT_RATE_LIMIT_BACKOFF_MS = 6 * 60 * 60 * 1000;
const API_FOOTBALL_ERROR_BACKOFF_MS = 60 * 60 * 1000;

export interface SignalDataCollectionResult {
  source: "gdelt" | "api-football";
  collectedAt: string;
  count: number;
  status?: "ok" | "empty" | "error" | "skipped";
  errors?: string[];
}

export async function collectGdeltNewsSignals(): Promise<SignalDataCollectionResult> {
  const collectedAt = new Date().toISOString();
  const repository = await getSignalDataRepository();
  const signalStats = await repository.readSourceStats();
  const skipReason = getGdeltSkipReason(signalStats.news.lastRun, collectedAt);

  if (skipReason) {
    await repository.recordCollectionRun({
      id: `gdelt:${collectedAt}`,
      source: "gdelt",
      collectedAt,
      count: 0,
      status: "skipped",
      errors: [skipReason],
    });

    return {
      source: "gdelt",
      collectedAt,
      count: 0,
      status: "skipped",
      errors: [skipReason],
    };
  }

  const queries = worldCupTeams.map(createExpandedTeamNewsQuery).filter(isTeamNewsQuery);
  const { articles, errors } = await collectGdeltArticlesInBatches(queries);
  const cappedArticles = capArticlesPerTeam(articles);
  const status = getCollectionRunStatus(cappedArticles.length, errors);
  const result = {
    source: "gdelt" as const,
    collectedAt,
    count: cappedArticles.length,
    status,
    errors: errors.length > 0 ? errors : undefined,
  };

  await repository.upsertNewsArticles(cappedArticles, collectedAt);
  await repository.recordCollectionRun({
    id: `gdelt:${collectedAt}`,
    source: "gdelt",
    collectedAt,
    count: cappedArticles.length,
    status,
    errors: result.errors,
  });

  return result;
}

async function collectGdeltArticlesInBatches(queries: TeamNewsQuery[]): Promise<{
  articles: NewsArticle[];
  errors: string[];
}> {
  const articles: NewsArticle[] = [];
  const errors: string[] = [];
  const selectedQueries = getRotatingBatch(queries, new Date().toISOString(), GDELT_TEAMS_PER_QUERY, GDELT_TEAM_BATCHES_PER_RUN);

  for (const batch of chunkArray(selectedQueries, GDELT_TEAMS_PER_QUERY)) {
    try {
      const batchArticles = gdeltNewsProvider.searchRecentWorldCupNews
        ? await gdeltNewsProvider.searchRecentWorldCupNews(batch)
        : (await Promise.all(batch.map((query) => gdeltNewsProvider.searchRecentTeamNews(query)))).flat();
      articles.push(...batchArticles);
    } catch (error) {
      errors.push(getErrorMessage(error));
    }
  }

  return {
    articles,
    errors,
  };
}

export async function collectApiFootballSignals(): Promise<SignalDataCollectionResult> {
  const collectedAt = new Date().toISOString();
  const context: ApiFootballTeamContext[] = [];
  const errors: string[] = [];
  const repository = await getSignalDataRepository();
  const signalStats = await repository.readSourceStats();
  const skipReason = getApiFootballSkipReason(signalStats.football.lastRun, collectedAt);

  if (skipReason) {
    await repository.recordCollectionRun({
      id: `api-football:${collectedAt}`,
      source: "api-football",
      collectedAt,
      count: 0,
      status: "skipped",
      errors: [skipReason],
    });

    return {
      source: "api-football",
      collectedAt,
      count: 0,
      status: "skipped",
      errors: [skipReason],
    };
  }

  const selectedConfigs = getApiFootballBatch(collectedAt);

  for (const config of selectedConfigs) {
    const team = worldCupTeams.find((item) => item.id === config.teamId);

    if (!team) {
      continue;
    }

    try {
      const teamContext = await getApiFootballTeamContext(team);

      if (teamContext) {
        context.push(teamContext);
      }
    } catch (error) {
      errors.push(`${team.name}: ${getErrorMessage(error)}`);
    }
  }

  const result = {
    source: "api-football" as const,
    collectedAt,
    count: context.length,
    status: getCollectionRunStatus(context.length, errors),
    errors: errors.length > 0 ? errors : undefined,
  };

  await repository.upsertFootballTeamContext(context, collectedAt);
  await repository.recordCollectionRun({
    id: `api-football:${collectedAt}`,
    source: "api-football",
    collectedAt,
    count: context.length,
    status: result.status,
    errors: result.errors,
  });

  return result;
}

export async function collectAllSignalData(): Promise<SignalDataCollectionResult[]> {
  const results: SignalDataCollectionResult[] = [];

  results.push(await collectGdeltNewsSignals());
  results.push(await collectApiFootballSignals());

  return results;
}

function createExpandedTeamNewsQuery(team: Team): TeamNewsQuery | undefined {
  const config = getTeamNewsQueryConfig(team.id);
  const aliases = config?.aliases ?? [team.name, `${team.name} national team`, ...(team.aliases ?? [])];
  const countryAliases = config?.countryAliases ?? [team.name];

  const endDate = getBucketedDate(new Date());
  const startDate = new Date(endDate);
  startDate.setUTCDate(endDate.getUTCDate() - NEWS_LOOKBACK_DAYS);

  return {
    teamId: team.id,
    teamName: team.name,
    aliases,
    countryAliases,
    keyPlayers: config?.keyPlayers ?? [],
    excludeTerms: config?.excludeTerms ?? ["club world cup"],
    contextKeywords: [
      ...WORLD_CUP_CONTEXT_KEYWORDS,
      "football",
      "soccer",
      "coach",
      "injury",
      "friendly",
      "selection",
      "roster",
    ],
    startDate,
    endDate,
    maxArticles: MAX_ARTICLES_PER_TEAM,
  };
}

function getApiFootballBatch(collectedAt: string): typeof apiFootballTeamConfig {
  const teamIds = new Set(worldCupTeams.map((team) => team.id));
  const activeConfigs = apiFootballTeamConfig.filter((config) => teamIds.has(config.teamId));

  return getRotatingBatch(activeConfigs, collectedAt, API_FOOTBALL_TEAMS_PER_RUN, 1);
}

function capArticlesPerTeam(articles: NewsArticle[]): NewsArticle[] {
  const countsByTeam = new Map<string, number>();

  return articles.filter((article) => {
    const allowedTeamIds = article.matchedTeamIds.filter((teamId) => {
      const count = countsByTeam.get(teamId) ?? 0;

      if (count >= MAX_ARTICLES_PER_TEAM) {
        return false;
      }

      countsByTeam.set(teamId, count + 1);
      return true;
    });

    article.matchedTeamIds = allowedTeamIds;
    return allowedTeamIds.length > 0;
  });
}

function getBucketedDate(value: Date): Date {
  const bucketed = new Date(value);
  const bucketMinutes = Math.floor(bucketed.getUTCMinutes() / 10) * 10;
  bucketed.setUTCMinutes(bucketMinutes, 0, 0);

  return bucketed;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function getRotatingBatch<T>(items: T[], collectedAt: string, perBatch: number, batchCount: number): T[] {
  if (items.length <= perBatch * batchCount) {
    return items;
  }

  const date = new Date(collectedAt);
  const tenMinuteBucket = Math.floor(date.getUTCMinutes() / 10);
  const dayBucket = Math.floor(date.getTime() / 86_400_000);
  const runBucket = dayBucket * 144 + date.getUTCHours() * 6 + tenMinuteBucket;
  const count = Math.min(items.length, perBatch * batchCount);
  const start = (runBucket * count) % items.length;

  return Array.from({ length: count }, (_, index) => items[(start + index) % items.length]);
}

function getGdeltSkipReason(
  lastRun: { collectedAt: string; status: "ok" | "empty" | "error" | "skipped"; errors?: string[] } | undefined,
  collectedAt: string,
): string | undefined {
  if (!lastRun) {
    return undefined;
  }

  const ageMs = new Date(collectedAt).getTime() - new Date(lastRun.collectedAt).getTime();

  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return undefined;
  }

  if (lastRun.status === "error" && hasRecoverableGdeltError(lastRun.errors) && ageMs < GDELT_RATE_LIMIT_BACKOFF_MS) {
    const nextRetryAt = new Date(new Date(lastRun.collectedAt).getTime() + GDELT_RATE_LIMIT_BACKOFF_MS).toISOString();
    return `GDELT backoff active until ${nextRetryAt}.`;
  }

  if (ageMs < GDELT_MIN_RUN_INTERVAL_MS) {
    const nextRetryAt = new Date(new Date(lastRun.collectedAt).getTime() + GDELT_MIN_RUN_INTERVAL_MS).toISOString();
    return `GDELT collection is limited to one attempt per hour. Next attempt after ${nextRetryAt}.`;
  }

  return undefined;
}

function getApiFootballSkipReason(
  lastRun: { collectedAt: string; status: "ok" | "empty" | "error" | "skipped"; errors?: string[] } | undefined,
  collectedAt: string,
): string | undefined {
  if (!lastRun || lastRun.status !== "error" || !hasApiFootballRateLimitError(lastRun.errors)) {
    return undefined;
  }

  const ageMs = new Date(collectedAt).getTime() - new Date(lastRun.collectedAt).getTime();

  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs >= API_FOOTBALL_ERROR_BACKOFF_MS) {
    return undefined;
  }

  const nextRetryAt = new Date(new Date(lastRun.collectedAt).getTime() + API_FOOTBALL_ERROR_BACKOFF_MS).toISOString();
  return `API-Football rate-limit backoff active until ${nextRetryAt}.`;
}

function hasRecoverableGdeltError(errors: string[] | undefined): boolean {
  return (errors ?? []).some((error) => {
    const normalized = error.toLowerCase();
    return (
      normalized.includes("http 429") ||
      normalized.includes("rate") ||
      normalized.includes("aborted") ||
      normalized.includes("not valid json") ||
      normalized.includes("unexpected token")
    );
  });
}

function hasApiFootballRateLimitError(errors: string[] | undefined): boolean {
  return (errors ?? []).some((error) => {
    const normalized = error.toLowerCase();
    return normalized.includes("too many requests") || normalized.includes("rate") || normalized.includes("limit");
  });
}

function isTeamNewsQuery(query: TeamNewsQuery | undefined): query is TeamNewsQuery {
  return Boolean(query);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to collect signal data.";
}

function getCollectionRunStatus(count: number, errors: string[]): "ok" | "empty" | "error" {
  if (count > 0) {
    return "ok";
  }

  return errors.length > 0 ? "error" : "empty";
}
