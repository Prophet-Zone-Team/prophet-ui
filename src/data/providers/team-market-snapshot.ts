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
import type { Team, TeamMarketSnapshot } from "@/types/market";

const TEAM_SNAPSHOT_CACHE_TTL_MS = 60_000;

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

  return fetchTeamSnapshotFromWinnerEvent(team.id);
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
