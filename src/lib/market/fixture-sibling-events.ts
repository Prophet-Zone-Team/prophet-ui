import type { GammaMarketRecord } from "@/lib/market/polymarket-gamma";

/** Polymarket splits fixture pages into sibling Gamma events under the main slug. */
export const FIXTURE_SIBLING_EVENT_SUFFIXES = [
  "more-markets",
  "exact-score",
  "halftime-result",
] as const;

export function isFixtureMainEventSlug(slug: string): boolean {
  const trimmed = slug.trim();

  return (
    trimmed.startsWith("fifwc-") &&
    !FIXTURE_SIBLING_EVENT_SUFFIXES.some((suffix) =>
      trimmed.endsWith(`-${suffix}`),
    )
  );
}

/** Normalize fixture sibling event or market slugs to the main game event slug. */
export function resolveFixtureMainEventSlug(slug: string): string {
  const trimmed = slug.trim();

  if (!trimmed) {
    return trimmed;
  }

  for (const suffix of FIXTURE_SIBLING_EVENT_SUFFIXES) {
    if (trimmed.endsWith(`-${suffix}`)) {
      return trimmed.slice(0, -(suffix.length + 1));
    }
  }

  const match = trimmed.match(/^(.+\d{4}-\d{2}-\d{2})(?:-.+)?$/);

  return match?.[1] ?? trimmed;
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
