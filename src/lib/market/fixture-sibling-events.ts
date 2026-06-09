import type { GammaMarketRecord } from "@/lib/market/polymarket-gamma";

/** Polymarket splits fixture pages into sibling Gamma events under the main slug. */
export const FIXTURE_SIBLING_EVENT_SUFFIXES = [
  "more-markets",
  "exact-score",
  "halftime-result",
] as const;

export function isFixtureMainEventSlug(slug: string): boolean {
  return true;
  return slug.startsWith("fifwc-") && !FIXTURE_SIBLING_EVENT_SUFFIXES.some((suffix) => slug.endsWith(`-${suffix}`));
}

export function resolveFixtureSiblingSlugs(slug: string): string[] {
  if (!isFixtureMainEventSlug(slug)) {
    return [];
  }

  return FIXTURE_SIBLING_EVENT_SUFFIXES.map((suffix) => `${slug}-${suffix}`);
}

export function mergeGammaMarkets(
  ...marketLists: Array<GammaMarketRecord[] | undefined>
): GammaMarketRecord[] {
  const byKey = new Map<string, GammaMarketRecord>();

  for (const list of marketLists) {
    for (const market of list ?? []) {
      const key = market.conditionId ?? market.id ?? market.slug;

      if (key) {
        byKey.set(String(key), market);
      }
    }
  }

  return [...byKey.values()];
}
