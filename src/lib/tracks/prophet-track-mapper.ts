import {
  findCuratedTeamByCode,
  findCuratedTeamById,
  findCuratedTeamByName,
} from "@/data/teams/curated-team-list";
import { extractFastBidPolymarketMetadata } from "@/lib/market/polymarket-fast-bid-metadata";
import {
  parseGammaArrayField,
  priceToProbability,
  toGammaNumber,
  type GammaMarketRecord
} from "@/lib/market/polymarket-gamma";
import { resolveWorldCupTeamByGroupItemTitle } from "@/lib/market/resolve-winner-team";
import { parseJsonArrayField } from "@/lib/analytics/map-news";
import type {
  ProphetUserTrackItem,
  ProphetUserTrackLatestNews,
  ProphetUserTrackNewsStat
} from "@/types/prophet-api";
import type {
  Team,
  TeamMarketData,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import type {
  TrackCardGameProps,
  TrackCardProps
} from "@/views/tracks/track-card";
import type {
  TrackCardGamePowerRanking,
  TrackCardSignalItem,
  TrackCardSignalsSummary,
  TrackCardTeamPowerRanking
} from "@/views/tracks/track-card/types";

function parseNumericField(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function isGameTrack(item: ProphetUserTrackItem): boolean {
  if (item.category === "game") {
    return true;
  }

  if (item.category === "team") {
    return false;
  }

  if (item.goals && item.goals.length > 0) {
    return true;
  }

  if (item.team) {
    return false;
  }

  return item.team_name?.includes(",") ?? false;
}

function parseGameTeamNames(
  teamName: string | undefined
): [string, string] | undefined {
  if (!teamName?.trim()) {
    return undefined;
  }

  const parts = teamName
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return undefined;
  }

  return [parts[0]!, parts[1]!];
}

function resolveGameTrackTeams(
  item: ProphetUserTrackItem
): { homeTeam: Team; awayTeam: Team } | undefined {
  const names = parseGameTeamNames(item.team_name);

  if (!names) {
    return undefined;
  }

  const homeTeam = resolveWorldCupTeamByGroupItemTitle(names[0]);
  const awayTeam = resolveWorldCupTeamByGroupItemTitle(names[1]);

  if (!homeTeam || !awayTeam) {
    return undefined;
  }

  return { homeTeam, awayTeam };
}

function resolveTrackProbability(item: ProphetUserTrackItem): number {
  const fallbackProbability = parseNumericField(item.probobility) ?? 0;
  const firstMarket = item.markets?.[0];

  if (!firstMarket?.outcomePrices) {
    return fallbackProbability;
  }

  const prices = parseGammaArrayField(firstMarket.outcomePrices);
  const yesPrice = toGammaNumber(prices[0]);

  return priceToProbability(yesPrice) ?? fallbackProbability;
}

function resolveGameTrackProbability(item: ProphetUserTrackItem): {
  probability: number;
  teamCode: string;
} {
  const firstMarket = item.markets?.[0];
  const probability = resolveTrackProbability(item);
  const marketTeam = resolveWorldCupTeamByGroupItemTitle(
    firstMarket?.groupItemTitle?.trim() ?? ""
  );

  return {
    probability,
    teamCode: marketTeam?.code ?? firstMarket?.groupItemTitle?.trim() ?? ""
  };
}

function parseKickoffFromSlug(slug: string | undefined): string | undefined {
  if (!slug) {
    return undefined;
  }

  const match = slug.match(/(\d{4}-\d{2}-\d{2})$/);

  if (!match) {
    return undefined;
  }

  return `${match[1]}T00:00:00.000Z`;
}

function hashFixtureId(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash % 1_000_000 || 1;
}

function parseUnknownJsonField(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

function parseMatchedPlayers(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof value === "string") {
    return parseJsonArrayField(value);
  }

  return [];
}

function normalizeLatestNewsEntry(
  entry: unknown
): ProphetUserTrackLatestNews | undefined {
  if (!entry || typeof entry !== "object") {
    return undefined;
  }

  const record = entry as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title : undefined;

  if (!title) {
    return undefined;
  }

  const rawScore = record.score;
  const score =
    typeof rawScore === "number"
      ? rawScore
      : typeof rawScore === "string"
        ? Number(rawScore)
        : 0;

  return {
    title,
    score: Number.isFinite(score) ? score : 0,
    matched_players: parseMatchedPlayers(record.matched_players)
  };
}

function parseTrackLatestNews(value: unknown): ProphetUserTrackLatestNews[] {
  const parsed = parseUnknownJsonField(value);

  if (!parsed) {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map(normalizeLatestNewsEntry)
    .filter(
      (entry): entry is ProphetUserTrackLatestNews => entry !== undefined
    );
}

function parseTeamNewsStat(
  value: ProphetUserTrackItem["team_news_stat"]
): ProphetUserTrackNewsStat | undefined {
  const parsed = parseUnknownJsonField(value);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return undefined;
  }

  return parsed as ProphetUserTrackNewsStat;
}

function resolveFifaRankAtIndex(
  rankings: number[] | undefined,
  index: number
): number {
  const value = rankings?.[index];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapTrackFifaRankingForTeam(
  item: ProphetUserTrackItem
): TrackCardTeamPowerRanking {
  return { rank: resolveFifaRankAtIndex(item.fifa_rankings, 0) };
}

function mapTrackFifaRankingForGame(
  item: ProphetUserTrackItem,
  homeTeam: Team,
  awayTeam: Team
): TrackCardGamePowerRanking {
  const rankings = item.fifa_rankings;

  return {
    home: {
      team: homeTeam,
      rank: resolveFifaRankAtIndex(rankings, 0)
    },
    away: {
      team: awayTeam,
      rank: resolveFifaRankAtIndex(rankings, 1)
    }
  };
}

function buildTrackSignalThumbnailAlt(
  news: ProphetUserTrackLatestNews
): string {
  if (news.matched_players[0]?.trim()) {
    return news.matched_players[0].trim();
  }

  return news.title.split(/\s+/).slice(0, 2).join(" ") || "News";
}

function mapLatestNewsToTrackSignalItem(
  news: ProphetUserTrackLatestNews,
  index: number
): TrackCardSignalItem {
  return {
    id: `${index}-${news.title}`,
    headline: news.title,
    sentiment: news.score >= 50 ? "positive" : "negative",
    thumbnailAlt: buildTrackSignalThumbnailAlt(news)
  };
}

function mapTrackNewsStat(item: ProphetUserTrackItem): {
  signals: TrackCardSignalsSummary;
  signalItems: TrackCardSignalItem[];
} {
  const newsStat = parseTeamNewsStat(item.team_news_stat);
  const latestNews = parseTrackLatestNews(newsStat?.latest_news);

  return {
    signals: { count: newsStat?.news_count ?? 0 },
    signalItems: latestNews.map(mapLatestNewsToTrackSignalItem)
  };
}

function buildGameMatch(
  item: ProphetUserTrackItem,
  homeTeam: Team,
  awayTeam: Team
): WorldCupMatch | undefined {
  const slug = item.slug?.trim();

  if (!slug) {
    return undefined;
  }

  const lastUpdated = new Date().toISOString();

  return {
    id: slug,
    matchId: hashFixtureId(slug),
    stage: "EXTERNAL",
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeDisplayName: homeTeam.name,
    awayDisplayName: awayTeam.name,
    status: "scheduled",
    kickoffAt: item.start_time?.trim() || parseKickoffFromSlug(slug),
    league: "FIFA World Cup",
    freshness: {
      source: "prophet-api",
      status: "live",
      lastUpdated
    },
    polymarket: {
      eventId: slug,
      slug,
      volume: parseNumericField(item.volume) ?? 0,
      moneyline: {
        acceptingOrders: true,
        outcomes: []
      }
    }
  };
}

function mapProphetGameTrackToCardProps(
  item: ProphetUserTrackItem
): TrackCardGameProps | undefined {
  const teams = resolveGameTrackTeams(item);
  if (!teams) {
    return undefined;
  }

  const match = buildGameMatch(item, teams.homeTeam, teams.awayTeam);

  if (!match) {
    return undefined;
  }

  const { probability, teamCode } = resolveGameTrackProbability(item);
  const { signals, signalItems } = mapTrackNewsStat(item);

  return {
    variant: "game",
    match,
    homeTeam: teams.homeTeam,
    awayTeam: teams.awayTeam,
    probability,
    probabilityTeamCode: teamCode,
    volume: parseNumericField(item.volume) ?? 0,
    powerRanking: mapTrackFifaRankingForGame(
      item,
      teams.homeTeam,
      teams.awayTeam
    ),
    signals,
    signalItems
  };
}

function resolveTeam(item: ProphetUserTrackItem): Team | undefined {
  const prophetTeam = item.team;

  if (prophetTeam?.code) {
    const byCode = findCuratedTeamByCode(prophetTeam.code);

    if (byCode) {
      return byCode;
    }
  }

  const nameCandidates = [
    prophetTeam?.name,
    item.team_name,
    item.slug?.replace(/-/g, " ")
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const candidate of nameCandidates) {
    const byName = findCuratedTeamByName(candidate);

    if (byName) {
      return byName;
    }
  }

  const slug = item.slug?.trim();

  if (slug) {
    const byId = findCuratedTeamById(slug);

    if (byId) {
      return byId;
    }
  }

  return undefined;
}

function buildTeamMarketData(
  teamId: Team["id"],
  item: ProphetUserTrackItem
): TeamMarketData {
  const firstMarket = item.markets?.[0];
  const probability = resolveTrackProbability(item);
  const change24h =
    parseNumericField(firstMarket?.oneDayPriceChange) ??
    parseNumericField(item.oneDayPriceChange) ??
    0;
  const change7d =
    parseNumericField(firstMarket?.oneWeekPriceChange) ??
    parseNumericField(item.oneWeekPriceChange) ??
    0;
  const volume =
    parseNumericField(firstMarket?.volume) ??
    parseNumericField(item.volume) ??
    0;
  const polymarket = firstMarket
    ? extractFastBidPolymarketMetadata(firstMarket as GammaMarketRecord)
    : undefined;

  return {
    teamId,
    probability,
    change24h,
    change7d,
    volume,
    sentiment:
      change24h > 0 ? "bullish" : change24h < 0 ? "bearish" : "neutral",
    bookmakerImpliedProbability: probability,
    updatedAt: new Date().toISOString(),
    slug: firstMarket?.slug?.trim() || item.slug?.trim() || "",
    polymarket
  };
}

function mapProphetTeamTrackToCardProps(
  item: ProphetUserTrackItem
): TrackCardProps | undefined {
  const team = resolveTeam(item);

  if (!team) {
    return undefined;
  }

  const snapshot: TeamMarketSnapshot = {
    team,
    market: buildTeamMarketData(team.id, item)
  };
  const { signals, signalItems } = mapTrackNewsStat(item);

  return {
    snapshot,
    powerRanking: mapTrackFifaRankingForTeam(item),
    signals,
    signalItems
  };
}

export function mapProphetTrackToCardProps(
  item: ProphetUserTrackItem
): TrackCardProps | undefined {
  if (isGameTrack(item)) {
    return mapProphetGameTrackToCardProps(item);
  }

  return mapProphetTeamTrackToCardProps(item);
}

export function mapProphetTracksToCardProps(
  items: ProphetUserTrackItem[]
): TrackCardProps[] {
  const cards: TrackCardProps[] = [];

  for (const item of items) {
    const card = mapProphetTrackToCardProps(item);

    if (card) {
      cards.push(card);
    }
  }

  return cards;
}
