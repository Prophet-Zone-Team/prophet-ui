import "server-only";

import { mapEventSportsMarkets } from "@/lib/market/fixture-markets-mapper";
import {
  isFixtureMainEventSlug,
  mergeGammaMarkets,
  resolveFixtureSiblingSlugs,
} from "@/lib/market/fixture-sibling-events";
import {
  GAMMA_API_BASE,
  isGammaEventRecord,
  type GammaEventRecord,
  type GammaMarketRecord,
} from "@/lib/market/polymarket-gamma";
import { serverFetch } from "@/server/trading/server-fetch";
import type { WorldCupMatch } from "@/types/market";

const siblingMarketsCache = new Map<string, GammaMarketRecord[]>();

export function clearFixtureSiblingMarketsCache(): void {
  siblingMarketsCache.clear();
}

export async function enrichMatchWithSiblingFixtureMarkets(
  match: WorldCupMatch,
): Promise<WorldCupMatch> {
  const slug = match.polymarket?.slug;
  const moneylineOutcomes = match.polymarket?.moneyline.outcomes ?? [];

  if (!slug || !isFixtureMainEventSlug(slug) || moneylineOutcomes.length === 0) {
    return match;
  }

  const siblingMarkets = await fetchSiblingMarketsForSlug(slug);

  if (siblingMarkets.length === 0) {
    return match;
  }

  const homeName = match.homeDisplayName ?? match.homeSeed ?? "Home";
  const awayName = match.awayDisplayName ?? match.awaySeed ?? "Away";
  const fixtureMarkets = mapEventSportsMarkets(
    siblingMarkets,
    homeName,
    awayName,
    moneylineOutcomes,
  );

  return {
    ...match,
    polymarket: {
      ...match.polymarket!,
      fixtureMarkets,
    },
  };
}

async function fetchSiblingMarketsForSlug(slug: string): Promise<GammaMarketRecord[]> {
  const cached = siblingMarketsCache.get(slug);

  if (cached) {
    return cached;
  }

  const siblingSlugs = resolveFixtureSiblingSlugs(slug);
  const siblingEvents = await Promise.all(siblingSlugs.map(fetchGammaEventBySlug));
  const markets = mergeGammaMarkets(...siblingEvents.map((event) => event?.markets));

  siblingMarketsCache.set(slug, markets);

  return markets;
}

async function fetchGammaEventBySlug(slug: string): Promise<GammaEventRecord | undefined> {
  const response = await serverFetch(`${GAMMA_API_BASE}/events/slug/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  if (response.status === 404 || !response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as unknown;

  return isGammaEventRecord(payload) ? payload : undefined;
}
