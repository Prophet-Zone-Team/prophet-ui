import { worldCupTeams } from "@/data/teams/world-cup-teams";
import { extractFastBidPolymarketMetadata } from "@/lib/market/polymarket-fast-bid-metadata";
import {
  parseGammaArrayField,
  priceToProbability,
  toGammaNumber,
  type GammaMarketRecord
} from "@/lib/market/polymarket-gamma";
import { resolveWorldCupTeamByGroupItemTitle } from "@/lib/market/resolve-winner-team";
import type { ProphetUserTrackItem } from "@/types/prophet-api";
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

function parseNumericField(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeLookupKey(value: string): string {
  return value.trim().toLowerCase();
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
    kickoffAt: parseKickoffFromSlug(slug),
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
  console.log(item, teams);
  if (!teams) {
    return undefined;
  }

  const match = buildGameMatch(item, teams.homeTeam, teams.awayTeam);

  if (!match) {
    return undefined;
  }

  const { probability, teamCode } = resolveGameTrackProbability(item);

  return {
    variant: "game",
    match,
    homeTeam: teams.homeTeam,
    awayTeam: teams.awayTeam,
    probability,
    probabilityTeamCode: teamCode,
    volume: parseNumericField(item.volume) ?? 0,
    powerRanking: {
      home: { team: teams.homeTeam, rank: 0 },
      away: { team: teams.awayTeam, rank: 0 }
    },
    signals: { count: 0 },
    signalItems: []
  };
}

function resolveTeam(item: ProphetUserTrackItem): Team | undefined {
  const prophetTeam = item.team;

  if (prophetTeam?.code) {
    const byCode = worldCupTeams.find(
      (team) => team.code.toLowerCase() === prophetTeam.code!.toLowerCase()
    );

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
    const normalized = normalizeLookupKey(candidate);

    const byName = worldCupTeams.find(
      (team) =>
        normalizeLookupKey(team.name) === normalized ||
        team.aliases?.some((alias) => normalizeLookupKey(alias) === normalized)
    );

    if (byName) {
      return byName;
    }
  }

  const slug = item.slug?.trim();

  if (slug) {
    const byId = worldCupTeams.find((team) => team.id === slug);

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

  return {
    snapshot,
    powerRanking: { rank: 0 },
    signals: { count: 0 },
    signalItems: []
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
