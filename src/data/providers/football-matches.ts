import {
  clearMockScheduleMatchesCache,
  getMockScheduleMatchesFromFile,
  getMockScheduleMatchesMeta,
  USE_MOCK_SCHEDULE_MATCHES
} from "@/data/mock/schedule-matches";
import { clearFootballMatchesFileFallbackCache } from "@/data/providers/football-matches-fallback";
import {
  clearPolymarketFootballEventsCache,
} from "@/data/providers/polymarket-football-events-provider";
import { mapProphetGameDetailToMatch } from "@/lib/market/prophet-game-detail-mapper";
import { mapProphetGamesToMatches } from "@/lib/market/prophet-game-mapper";
import { clearFixtureSiblingMarketsCache } from "@/server/market/fixture-sibling-enrichment";
import { getProphetGame, getProphetGames } from "@/service/prophet";
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

  const result = await fetchProphetFootballMatches();

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

  try {
    const detail = await getProphetGame(slug);

    return mapProphetGameDetailToMatch(detail);
  } catch {
    return undefined;
  }
}

export async function findFootballMatch(
  matchId: string,
): Promise<WorldCupMatch | undefined> {
  return getFootballMatchBySlug(matchId);
}

async function fetchProphetFootballMatches(): Promise<FootballMatchesResult> {
  const lastUpdated = new Date().toISOString();

  try {
    const { list } = await getProphetGames();
    const matches = mapProphetGamesToMatches(list ?? []);

    return {
      matches,
      meta: {
        source: "prophet-api",
        status: matches.length > 0 ? "live" : "unavailable",
        lastUpdated
      }
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load Prophet games.";

    return {
      matches: [],
      meta: {
        source: `prophet-api: ${message}`,
        status: "unavailable",
        lastUpdated
      }
    };
  }
}

export function clearFootballMatchesCache(): void {
  cachedResult = undefined;
  clearMockScheduleMatchesCache();
  clearPolymarketFootballEventsCache();
  clearFootballMatchesFileFallbackCache();
  clearFixtureSiblingMarketsCache();
}
