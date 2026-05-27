import {
  clearMockScheduleMatchesCache,
  getMockScheduleMatchesFromFile,
  getMockScheduleMatchesMeta,
  USE_MOCK_SCHEDULE_MATCHES
} from "@/data/mock/schedule-matches";
import { clearFootballMatchesFileFallbackCache } from "@/data/providers/football-matches-fallback";
import {
  clearPolymarketFootballEventsCache,
  fetchPolymarketFootballEvents,
  fetchPolymarketFootballMatchBySlug
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

function findMatchInList(
  slug: string,
  matches: WorldCupMatch[],
): WorldCupMatch | undefined {
  return matches.find(
    (match) => match.id === slug || match.polymarket?.slug === slug,
  );
}

export async function getFootballMatchBySlug(
  slug: string,
): Promise<WorldCupMatch | undefined> {
  if (USE_MOCK_SCHEDULE_MATCHES) {
    const matches = await getMockScheduleMatchesFromFile();
    return findMatchInList(slug, matches);
  }

  return fetchPolymarketFootballMatchBySlug(slug);
}

export async function findFootballMatch(
  matchId: string,
): Promise<WorldCupMatch | undefined> {
  return getFootballMatchBySlug(matchId);
}

export function clearFootballMatchesCache(): void {
  cachedResult = undefined;
  clearMockScheduleMatchesCache();
  clearPolymarketFootballEventsCache();
  clearFootballMatchesFileFallbackCache();
  clearFixtureSiblingMarketsCache();
}
