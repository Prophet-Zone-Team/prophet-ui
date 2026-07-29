import {
  clearMockScheduleMatchesCache,
} from "@/data/mock/schedule-matches";
import { clearFootballMatchesFileFallbackCache } from "@/data/providers/football-matches-fallback";
import {
  clearPolymarketFootballEventsCache,
} from "@/data/providers/polymarket-football-events-provider";
import { mapProphetGameDetailToMatch } from "@/lib/market/prophet-game-detail-mapper";
import { mapProphetGamesToMatches } from "@/lib/market/prophet-game-mapper";
import { clearFixtureSiblingMarketsCache } from "@/server/market/fixture-sibling-enrichment";
import {
  getProphetGame,
  getProphetGames,
  type ProphetGamesQuery
} from "@/service/prophet";
import type { FreshnessMeta, WorldCupMatch } from "@/types/market";

export interface FootballMatchesResult {
  matches: WorldCupMatch[];
  meta: FreshnessMeta;
}

export type FootballMatchesQuery = ProphetGamesQuery;

type CachedFootballMatches = FootballMatchesResult & { expiresAt: number };

const matchesCacheByKey = new Map<string, CachedFootballMatches>();

const MATCHES_CACHE_TTL_MS = 60_000;

function buildFootballMatchesCacheKey(params?: FootballMatchesQuery): string {
  const league = params?.league?.trim() || "all";
  const ended =
    params?.ended === undefined ? "default" : params.ended ? "true" : "false";
  return `${league}:${ended}`;
}

export async function getFootballMatches(
  params?: FootballMatchesQuery
): Promise<FootballMatchesResult> {
  const cacheKey = buildFootballMatchesCacheKey(params);
  const cachedResult = matchesCacheByKey.get(cacheKey);

  if (cachedResult && cachedResult.expiresAt > Date.now()) {
    return {
      matches: cachedResult.matches,
      meta: cachedResult.meta
    };
  }

  const result = await fetchProphetFootballMatches(params);

  matchesCacheByKey.set(cacheKey, {
    ...result,
    expiresAt: Date.now() + MATCHES_CACHE_TTL_MS
  });

  return result;
}

export async function getFootballMatchBySlug(
  slug: string
): Promise<WorldCupMatch | undefined> {
  try {
    const detail = await getProphetGame(slug);

    return mapProphetGameDetailToMatch(detail);
  } catch {
    return undefined;
  }
}

async function fetchProphetFootballMatches(
  params?: FootballMatchesQuery
): Promise<FootballMatchesResult> {
  const lastUpdated = new Date().toISOString();

  try {
    const { list } = await getProphetGames(params);
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
  matchesCacheByKey.clear();
  clearMockScheduleMatchesCache();
  clearPolymarketFootballEventsCache();
  clearFootballMatchesFileFallbackCache();
  clearFixtureSiblingMarketsCache();
}
