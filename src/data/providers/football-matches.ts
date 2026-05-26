import {
  clearMockScheduleMatchesCache,
  getMockScheduleMatchesFromFile,
  getMockScheduleMatchesMeta,
  USE_MOCK_SCHEDULE_MATCHES
} from "@/data/mock/schedule-matches";
import { clearFootballMatchesFileFallbackCache } from "@/data/providers/football-matches-fallback";
import {
  clearPolymarketFootballEventsCache,
  fetchPolymarketFootballEvents
} from "@/data/providers/polymarket-football-events-provider";
import { clearFixtureSiblingMarketsCache } from "@/server/market/fixture-sibling-enrichment";
import type { FreshnessMeta, WorldCupMatch } from "@/types/market";

export interface FootballMatchesResult {
  matches: WorldCupMatch[];
  meta: FreshnessMeta;
}

let cachedResult: (FootballMatchesResult & { expiresAt: number }) | undefined;

const MATCHES_CACHE_TTL_MS = 60_000;

export async function getFootballMatches(): Promise<FootballMatchesResult> {
  if (cachedResult && cachedResult.expiresAt > Date.now()) {
    return {
      matches: cachedResult.matches,
      meta: cachedResult.meta
    };
  }

  if (USE_MOCK_SCHEDULE_MATCHES) {
    const [matches, meta] = await Promise.all([
      getMockScheduleMatchesFromFile(),
      getMockScheduleMatchesMeta()
    ]);

    const result: FootballMatchesResult = { matches, meta };

    cachedResult = {
      ...result,
      expiresAt: Date.now() + MATCHES_CACHE_TTL_MS
    };

    return result;
  }

  const { matches, meta } = await fetchPolymarketFootballEvents();

  const result: FootballMatchesResult = {
    matches,
    meta
  };

  cachedResult = {
    ...result,
    expiresAt: Date.now() + MATCHES_CACHE_TTL_MS
  };

  return result;
}

export async function findFootballMatch(
  matchId: string
): Promise<WorldCupMatch | undefined> {
  const { matches } = await getFootballMatches();
  return matches.find(
    (match) => match.id === matchId || match.polymarket?.slug === matchId
  );
}

export function clearFootballMatchesCache(): void {
  cachedResult = undefined;
  clearMockScheduleMatchesCache();
  clearPolymarketFootballEventsCache();
  clearFootballMatchesFileFallbackCache();
  clearFixtureSiblingMarketsCache();
}
