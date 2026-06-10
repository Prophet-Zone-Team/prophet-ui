import { FIFA_WINNER_EVENT_PATH } from "@/config/fifa-winner-market";
import { mockDataProvider } from "@/data/providers/mock-data-provider";
import { enrichTeamSnapshotWithClobMetadata } from "@/data/providers/polymarket-data-provider";
import { normalizeMarketDataSource } from "@/data/providers/source";
import type { MarketDataMeta, TeamMarketSnapshotResult } from "@/data/providers/types";
import { curatedTeamsById } from "@/data/teams/curated-team-list";
import { fetchPolymarketGamma } from "@/lib/market/polymarket-gamma-fetch";
import { isGammaMarketRecord, type GammaEventRecord, type GammaMarketRecord } from "@/lib/market/polymarket-gamma";
import {
  mapGammaMarketToTeamSnapshot,
  mapWinnerEventToStorePatch,
  parseWinnerGammaEvent,
} from "@/lib/market/winner-event-mapper";
import { getMarketHistoryRepository } from "@/server/market-history/repository";
import type { MarketSentiment, Team, TeamMarketSnapshot } from "@/types/market";

const TEAM_SNAPSHOT_CACHE_TTL_MS = 60_000;
const MAX_STORED_AGE_MS = 6 * 60 * 60 * 1000;
const FRESH_AFTER_MS = 15 * 60 * 1000;

const teamMarketSnapshotCache = new Map<string, { result: TeamMarketSnapshotResult; expiresAt: number }>();

export async function getTeamMarketSnapshot(teamId: string): Promise<TeamMarketSnapshotResult | undefined> {
  const team = curatedTeamsById.get(teamId);

  if (!team) {
    return undefined;
  }

  const source = normalizeMarketDataSource(undefined);
  const cacheKey = `team:${teamId}:${source}`;
  const cached = teamMarketSnapshotCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cloneTeamMarketSnapshotResult(cached.result);
  }

  const result = await resolveTeamMarketSnapshot(team, source);

  if (!result) {
    return undefined;
  }

  teamMarketSnapshotCache.set(cacheKey, {
    result: cloneTeamMarketSnapshotResult(result),
    expiresAt: Date.now() + TEAM_SNAPSHOT_CACHE_TTL_MS,
  });

  return result;
}

async function resolveTeamMarketSnapshot(
  team: Team,
  source: ReturnType<typeof normalizeMarketDataSource>,
): Promise<TeamMarketSnapshotResult | undefined> {
  if (source === "mock") {
    return resolveMockTeamMarketSnapshot(team.id);
  }

  if (source !== "polymarket") {
    return undefined;
  }

  const stored = await readStoredTeamMarketSnapshot(team);
  const live = await fetchTeamSnapshotFromWinnerEvent(team.id);

  if (stored && live) {
    return {
      snapshot: mergeStoredAndLiveSnapshots(stored.snapshot, live.snapshot),
      meta: live.meta.stale === false ? live.meta : stored.meta,
    };
  }

  if (live) {
    return live;
  }

  if (stored && hasPolymarketOutcomeTokenIds(stored.snapshot)) {
    return stored;
  }

  if (stored) {
    const refreshed = await fetchTeamSnapshotFromWinnerEvent(team.id);

    if (refreshed) {
      return {
        snapshot: mergeStoredAndLiveSnapshots(stored.snapshot, refreshed.snapshot),
        meta: refreshed.meta,
      };
    }

    return stored;
  }

  return live;
}

async function resolveMockTeamMarketSnapshot(teamId: string): Promise<TeamMarketSnapshotResult | undefined> {
  const data = await mockDataProvider.getWorldCupMarketData();
  const snapshot = data.snapshots.find((item) => item.team.id === teamId);

  if (!snapshot) {
    return undefined;
  }

  return {
    snapshot: cloneTeamMarketSnapshot(snapshot),
    meta: { ...data.meta },
  };
}

async function readStoredTeamMarketSnapshot(team: Team): Promise<TeamMarketSnapshotResult | undefined> {
  const repository = await getMarketHistoryRepository();
  const since = new Date(Date.now() - MAX_STORED_AGE_MS).toISOString();
  const records = await repository.readSnapshots({
    source: "polymarket",
    teamId: team.id,
    since,
  });

  if (records.length === 0) {
    return undefined;
  }

  const latest = [...records].sort((left, right) => right.capturedAt.localeCompare(left.capturedAt))[0];

  if (!latest) {
    return undefined;
  }

  const stale = Date.now() - new Date(latest.capturedAt).getTime() > FRESH_AFTER_MS;
  const snapshot: TeamMarketSnapshot = {
    team,
    market: {
      teamId: team.id,
      probability: latest.probability,
      change24h: latest.change24h,
      change7d: latest.change7d,
      volume: latest.volume,
      sentiment: latest.sentiment as MarketSentiment,
      bookmakerImpliedProbability: latest.bookmakerImpliedProbability,
      updatedAt: latest.marketUpdatedAt,
    },
  };

  return {
    snapshot,
    meta: {
      source: "polymarket",
      status: stale ? "cached" : "live",
      lastUpdated: latest.capturedAt,
      stale,
    },
  };
}

async function fetchTeamSnapshotFromWinnerEvent(
  teamId: string,
): Promise<TeamMarketSnapshotResult | undefined> {
  try {
    const payload = await fetchPolymarketGamma<GammaEventRecord>(FIFA_WINNER_EVENT_PATH);
    const event = parseWinnerGammaEvent(payload);

    if (!event) {
      return undefined;
    }

    const markets = (event.markets ?? []).filter(isGammaMarketRecord);
    const match = findBestTeamWinnerMarket(markets, teamId);

    if (!match) {
      return undefined;
    }

    const { market, snapshot: baseSnapshot } = match;
    const snapshot = await enrichTeamSnapshotWithClobMetadata(baseSnapshot, market);
    const patch = mapWinnerEventToStorePatch(event);
    const meta: MarketDataMeta = {
      source: "polymarket",
      status: "live",
      lastUpdated: patch.lastUpdated,
      stale: false,
    };

    return { snapshot, meta };
  } catch {
    return undefined;
  }
}

function findBestTeamWinnerMarket(
  markets: GammaMarketRecord[],
  teamId: string,
): { market: GammaMarketRecord; snapshot: TeamMarketSnapshot } | undefined {
  let best: { market: GammaMarketRecord; snapshot: TeamMarketSnapshot } | undefined;

  for (const market of markets) {
    const snapshot = mapGammaMarketToTeamSnapshot(market);

    if (!snapshot || snapshot.team.id !== teamId) {
      continue;
    }

    if (!best || snapshot.market.volume > best.snapshot.market.volume) {
      best = { market, snapshot };
    }
  }

  return best;
}

function mergeStoredAndLiveSnapshots(
  stored: TeamMarketSnapshot,
  live: TeamMarketSnapshot,
): TeamMarketSnapshot {
  const polymarket = live.market.polymarket ?? stored.market.polymarket;

  return {
    team: live.team,
    market: {
      ...stored.market,
      probability: live.market.probability,
      change24h: live.market.change24h,
      change7d: live.market.change7d,
      volume: live.market.volume,
      volume24h: live.market.volume24h ?? stored.market.volume24h,
      liquidity: live.market.liquidity ?? stored.market.liquidity,
      sentiment: live.market.sentiment,
      updatedAt: live.market.updatedAt,
      polymarket,
    },
  };
}

function hasPolymarketOutcomeTokenIds(snapshot: TeamMarketSnapshot): boolean {
  const tokens = snapshot.market.polymarket?.tokens;

  return Boolean(tokens?.yes?.tokenId || tokens?.no?.tokenId);
}

function cloneTeamMarketSnapshot(snapshot: TeamMarketSnapshot): TeamMarketSnapshot {
  return {
    team: { ...snapshot.team },
    market: {
      ...snapshot.market,
      polymarket: snapshot.market.polymarket
        ? {
            ...snapshot.market.polymarket,
            tokens: {
              yes: snapshot.market.polymarket.tokens.yes
                ? { ...snapshot.market.polymarket.tokens.yes }
                : undefined,
              no: snapshot.market.polymarket.tokens.no
                ? { ...snapshot.market.polymarket.tokens.no }
                : undefined,
            },
            fee: snapshot.market.polymarket.fee
              ? { ...snapshot.market.polymarket.fee }
              : undefined,
          }
        : undefined,
    },
  };
}

function cloneTeamMarketSnapshotResult(result: TeamMarketSnapshotResult): TeamMarketSnapshotResult {
  return {
    snapshot: cloneTeamMarketSnapshot(result.snapshot),
    meta: { ...result.meta },
  };
}
