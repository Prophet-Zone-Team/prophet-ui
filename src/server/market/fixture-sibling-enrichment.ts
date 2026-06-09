import "server-only";

import { mapEventSportsMarkets } from "@/lib/market/fixture-markets-mapper";
import {
  isFixtureMainEventSlug,
  mergeGammaMarkets,
  resolveFixtureSiblingSlugs
} from "@/lib/market/fixture-sibling-events";
import { fetchGammaEventBySlug } from "@/data/providers/polymarket-football-events-provider";
import type { GammaMarketRecord } from "@/lib/market/polymarket-gamma";
import type { WorldCupMatch } from "@/types/market";

const siblingMarketsCache = new Map<string, GammaMarketRecord[]>();

export function clearFixtureSiblingMarketsCache(): void {
  siblingMarketsCache.clear();
}

export async function enrichMatchWithSiblingFixtureMarkets(
  match: WorldCupMatch
): Promise<WorldCupMatch> {
  const slug = match.polymarket?.slug;
  const moneylineOutcomes = match.polymarket?.moneyline.outcomes ?? [];

  // TODO
  if (
    !slug ||
    !isFixtureMainEventSlug(slug) ||
    moneylineOutcomes.length === 0
  ) {
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
    moneylineOutcomes
  );

  return {
    ...match,
    polymarket: {
      ...match.polymarket!,
      fixtureMarkets
    }
  };
}

async function fetchSiblingMarketsForSlug(
  slug: string
): Promise<GammaMarketRecord[]> {
  const cached = siblingMarketsCache.get(slug);

  if (cached) {
    return cached;
  }

  const siblingSlugs = resolveFixtureSiblingSlugs(slug);
  const siblingEvents = await Promise.all(
    siblingSlugs.map(fetchGammaEventBySlug)
  );

  const markets = mergeGammaMarkets(
    ...siblingEvents.map((event) => event?.markets)
  );

  siblingMarketsCache.set(slug, markets);

  return markets;
}
