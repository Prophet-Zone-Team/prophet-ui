import {
  WORLD_CUP_CONTEXT_KEYWORDS,
  getTeamNewsQueryConfig,
} from "../../config/team-news-query-config";
import type {
  MarketSignal,
  NewsArticle,
  NewsEvent,
  NewsImpactSignal,
  SignalSeverity,
  TeamMarketSnapshot,
} from "../../types/market";
import { gdeltNewsProvider } from "./gdeltNewsProvider";
import type { NewsProvider, TeamNewsQuery } from "./types";

const NEWS_LOOKBACK_HOURS = 48;
const MARKET_MOVE_THRESHOLD = 0.8;
const MAX_TEAMS_TO_QUERY = 8;
const MAX_ARTICLES_PER_TEAM = 4;

export interface NewsImpactResult {
  newsEvents: NewsEvent[];
  impactSignals: NewsImpactSignal[];
  marketSignals: MarketSignal[];
  error?: string;
}

export async function getNewsImpactForSnapshots(
  snapshots: TeamMarketSnapshot[],
  provider: NewsProvider = gdeltNewsProvider,
): Promise<NewsImpactResult> {
  const candidates = getNewsCandidates(snapshots);

  if (candidates.length === 0) {
    return {
      newsEvents: [],
      impactSignals: [],
      marketSignals: [],
    };
  }

  const queries = candidates.map(createTeamNewsQuery).filter(isTeamNewsQuery);
  const articlesByTeam = new Map<string, NewsArticle[]>();
  let error: string | undefined;

  try {
    const articles = provider.searchRecentWorldCupNews
      ? await provider.searchRecentWorldCupNews(queries)
      : (await Promise.all(queries.map((query) => provider.searchRecentTeamNews(query)))).flat();

    for (const snapshot of candidates) {
      articlesByTeam.set(
        snapshot.team.id,
        articles
          .filter((article) => article.matchedTeamIds.includes(snapshot.team.id))
          .slice(0, MAX_ARTICLES_PER_TEAM),
      );
    }
  } catch (caughtError) {
    error = `News search unavailable: ${getErrorMessage(caughtError)}`;

    for (const snapshot of candidates) {
      articlesByTeam.set(snapshot.team.id, []);
    }
  }

  const impactSignals = candidates
    .map((snapshot) => createNewsImpactSignal(snapshot, articlesByTeam.get(snapshot.team.id) ?? []))
    .filter(isNewsImpactSignal);

  return {
    newsEvents: impactSignals.flatMap((signal) => createNewsEvents(signal, snapshots)),
    impactSignals,
    marketSignals: impactSignals.map((signal) => createMarketSignal(signal, snapshots)),
    error,
  };
}

export function getNewsCandidates(snapshots: TeamMarketSnapshot[]): TeamMarketSnapshot[] {
  return [...snapshots]
    .filter((snapshot) => Math.abs(snapshot.market.change24h) >= MARKET_MOVE_THRESHOLD)
    .sort((a, b) => Math.abs(b.market.change24h) - Math.abs(a.market.change24h))
    .slice(0, MAX_TEAMS_TO_QUERY);
}

function createTeamNewsQuery(snapshot: TeamMarketSnapshot): TeamNewsQuery | undefined {
  const config = getTeamNewsQueryConfig(snapshot.team.id);

  if (!config) {
    return undefined;
  }

  const endDate = getBucketedDate(new Date());
  const startDate = new Date(endDate);
  startDate.setUTCHours(endDate.getUTCHours() - NEWS_LOOKBACK_HOURS);

  return {
    teamId: snapshot.team.id,
    teamName: snapshot.team.name,
    aliases: config.aliases,
    countryAliases: config.countryAliases,
    keyPlayers: config.keyPlayers,
    excludeTerms: config.excludeTerms,
    contextKeywords: [...WORLD_CUP_CONTEXT_KEYWORDS],
    startDate,
    endDate,
    maxArticles: MAX_ARTICLES_PER_TEAM,
  };
}

function getBucketedDate(value: Date): Date {
  const bucketed = new Date(value);
  const bucketMinutes = Math.floor(bucketed.getUTCMinutes() / 5) * 5;
  bucketed.setUTCMinutes(bucketMinutes, 0, 0);

  return bucketed;
}

function createNewsImpactSignal(
  snapshot: TeamMarketSnapshot,
  articles: NewsArticle[],
): NewsImpactSignal | undefined {
  if (articles.length === 0) {
    return undefined;
  }

  const moveDirection = snapshot.market.change24h >= 0 ? "higher" : "lower";
  const confidence = articles.length >= 2 && Math.abs(snapshot.market.change24h) >= 1.2 ? "medium" : "low";

  return {
    type: "news_impact",
    teamId: snapshot.team.id,
    marketMove: snapshot.market.change24h,
    relatedArticles: articles,
    oneLineSummary: `Possible related coverage appeared while ${snapshot.team.name} moved ${moveDirection} over 24h.`,
    explanation:
      `The market moved ${formatSignedPoints(snapshot.market.change24h)} over 24h while recent coverage matched ` +
      `${snapshot.team.name} or related squad keywords. Treat this as context, not causation.`,
    confidence,
    disclaimer: "Correlation, not causation.",
  };
}

function createNewsEvents(signal: NewsImpactSignal, snapshots: TeamMarketSnapshot[]): NewsEvent[] {
  const snapshot = findSnapshot(snapshots, signal.teamId);

  return signal.relatedArticles.map((article, index) => ({
    id: `${article.id}-${signal.teamId}`,
    teamId: signal.teamId,
    headline: article.title,
    source: article.source ?? "GDELT",
    publishedAt: article.publishedAt ?? snapshot.market.updatedAt,
    impactScore: getImpactScore(signal.marketMove, signal.confidence, index),
    summary: `${signal.oneLineSummary} ${signal.disclaimer}`,
    url: article.url,
    language: article.language,
    matchedKeywords: article.matchedKeywords,
  }));
}

function createMarketSignal(signal: NewsImpactSignal, snapshots: TeamMarketSnapshot[]): MarketSignal {
  const snapshot = findSnapshot(snapshots, signal.teamId);

  return {
    id: `signal-${signal.teamId}-news-impact`,
    teamId: signal.teamId,
    type: "news-impact",
    severity: getNewsSeverity(signal),
    title: `${snapshot.team.name} has possible related coverage`,
    description: `${signal.oneLineSummary} ${signal.disclaimer}`,
    value: signal.marketMove,
    createdAt: snapshot.market.updatedAt,
  };
}

function getImpactScore(change24h: number, confidence: NewsImpactSignal["confidence"], index: number): number {
  const base = Math.min(86, Math.max(42, Math.round(Math.abs(change24h) * 24 + (confidence === "medium" ? 34 : 24))));
  const score = Math.max(35, base - index * 8);

  return change24h >= 0 ? score : -score;
}

function getNewsSeverity(signal: NewsImpactSignal): SignalSeverity {
  if (signal.confidence === "medium" && Math.abs(signal.marketMove) >= 1.5) {
    return "medium";
  }

  return "low";
}

function findSnapshot(snapshots: TeamMarketSnapshot[], teamId: string): TeamMarketSnapshot {
  const snapshot = snapshots.find((item) => item.team.id === teamId);

  if (!snapshot) {
    throw new Error(`Missing news impact snapshot for team: ${teamId}`);
  }

  return snapshot;
}

function isNewsImpactSignal(signal: NewsImpactSignal | undefined): signal is NewsImpactSignal {
  return Boolean(signal);
}

function isTeamNewsQuery(query: TeamNewsQuery | undefined): query is TeamNewsQuery {
  return Boolean(query);
}

function formatSignedPoints(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pts`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load related news.";
}
