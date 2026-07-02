import { buildFixtureMarketsSnapshot } from "@/lib/market/build-fixture-markets-snapshot";
import { buildGameMarketSnapshot } from "@/lib/market/game-market-snapshot";
import { mapEventSportsMarkets } from "@/lib/market/fixture-markets-mapper";
import {
  mergeGammaMarkets,
  resolveFixtureMainEventSlug,
  resolveFixtureSiblingSlugs,
} from "@/lib/market/fixture-sibling-events";
import {
  isGammaEventPayload,
  mergeMoneylineFromGammaEvent,
  syncFixtureMoneylineGroup,
} from "@/lib/market/merge-game-trading-metadata";
import { fetchPolymarket } from "@/lib/market/polymarket-api-client";
import type { GammaEventRecord, GammaMarketRecord } from "@/lib/market/polymarket-gamma";
import { mapGammaEventToMatch } from "@/lib/market/polymarket-football-match-mapper";
import { mapProphetGameDetailToMatch } from "@/lib/market/prophet-game-detail-mapper";
import {
  resolvePositionGameSellContext,
  type PositionGameSellContext,
} from "@/lib/portfolio/resolve-position-game-sell-context";
import { getProphetGame } from "@/service/prophet";
import type {
  PolymarketFixtureMarketsData,
  UserPositionRecord,
  WorldCupMatch,
} from "@/types/market";

export type { PositionGameSellContext } from "@/lib/portfolio/resolve-position-game-sell-context";

export async function fetchPositionGameSellContext(
  position: UserPositionRecord
): Promise<PositionGameSellContext | undefined> {
  const eventSlug = await resolveEventSlug(position);

  if (!eventSlug) {
    return undefined;
  }

  const mainEventSlug = resolveFixtureMainEventSlug(eventSlug);
  let match = await loadMatchForEventSlug(mainEventSlug);

  if (!match) {
    return undefined;
  }

  match = await enrichMatchWithSiblingFixtureMarkets(match, mainEventSlug);

  const gameSnapshot = buildGameMarketSnapshot(match, []);
  const fixtureMarkets = buildFixtureMarketsSnapshot(match);

  return resolvePositionGameSellContext(position, gameSnapshot, fixtureMarkets);
}

async function resolveEventSlug(
  position: UserPositionRecord
): Promise<string | undefined> {
  const eventSlug = position.eventSlug?.trim();

  if (eventSlug) {
    return eventSlug;
  }

  const slug = position.slug?.trim();

  if (!slug) {
    return undefined;
  }

  try {
    const market = await fetchPolymarket<
      GammaMarketRecord & { events?: Array<{ slug?: string }> }
    >(`/markets/slug/${encodeURIComponent(slug)}`);
    const eventSlugFromMarket = market.events?.[0]?.slug?.trim();

    if (eventSlugFromMarket) {
      return eventSlugFromMarket;
    }
  } catch {
    return resolveFixtureMainEventSlug(slug);
  }

  return resolveFixtureMainEventSlug(slug);
}

async function loadMatchForEventSlug(
  eventSlug: string
): Promise<WorldCupMatch | undefined> {
  try {
    const detail = await getProphetGame(eventSlug);
    return mapProphetGameDetailToMatch(detail);
  } catch {
    return loadMatchFromGammaEvent(eventSlug);
  }
}

async function loadMatchFromGammaEvent(
  eventSlug: string
): Promise<WorldCupMatch | undefined> {
  try {
    const payload = await fetchPolymarket<unknown>(
      `/events/slug/${encodeURIComponent(eventSlug)}`
    );

    if (!isGammaEventPayload(payload)) {
      return undefined;
    }

    return enrichMatchFromGammaEvent(mapGammaEventToMatch(payload), payload);
  } catch {
    return undefined;
  }
}

async function enrichMatchWithSiblingFixtureMarkets(
  match: WorldCupMatch,
  mainEventSlug: string
): Promise<WorldCupMatch> {
  if (!match.polymarket || !isFixtureMainEventSlugForEnrichment(mainEventSlug)) {
    return match;
  }

  const siblingSlugs = resolveFixtureSiblingSlugs(mainEventSlug);
  const siblingEvents = await Promise.all(
    siblingSlugs.map((slug) => fetchGammaEventBySlug(slug))
  );
  const siblingMarkets = mergeGammaMarkets(
    ...siblingEvents.map((event) => event?.markets)
  );

  if (siblingMarkets.length === 0) {
    return match;
  }

  const homeName = match.homeDisplayName ?? match.homeSeed ?? "Home";
  const awayName = match.awayDisplayName ?? match.awaySeed ?? "Away";
  const incoming = mapEventSportsMarkets(
    siblingMarkets,
    homeName,
    awayName,
    match.polymarket.moneyline.outcomes,
    match.polymarket.slug ?? match.id,
  );
  const existing = match.polymarket.fixtureMarkets ?? {
    lines: [],
    exactScores: [],
    halftime: [],
  };

  return {
    ...match,
    polymarket: {
      ...match.polymarket,
      fixtureMarkets: mergeFixtureMarketsData(existing, incoming),
    },
  };
}

function isFixtureMainEventSlugForEnrichment(slug: string): boolean {
  return slug.startsWith("fifwc-") || slug.startsWith("fif-");
}

function mergeFixtureMarketsData(
  existing: PolymarketFixtureMarketsData,
  incoming: PolymarketFixtureMarketsData
): PolymarketFixtureMarketsData {
  const mergedLines = [...existing.lines];

  for (const incomingGroup of incoming.lines) {
    if (incomingGroup.outcomes.length === 0) {
      continue;
    }

    const existingIndex = mergedLines.findIndex(
      (group) => group.type === incomingGroup.type
    );

    if (existingIndex >= 0) {
      mergedLines[existingIndex] = incomingGroup;
      continue;
    }

    mergedLines.push(incomingGroup);
  }

  return {
    lines: mergedLines,
    exactScores: incoming.exactScores.length
      ? incoming.exactScores
      : existing.exactScores,
    halftime: incoming.halftime.length ? incoming.halftime : existing.halftime,
  };
}

async function fetchGammaEventBySlug(
  slug: string
): Promise<GammaEventRecord | undefined> {
  try {
    const payload = await fetchPolymarket<unknown>(
      `/events/slug/${encodeURIComponent(slug)}`
    );

    return isGammaEventPayload(payload) ? payload : undefined;
  } catch {
    return undefined;
  }
}

function enrichMatchFromGammaEvent(
  match: WorldCupMatch | undefined,
  event: GammaEventRecord
): WorldCupMatch | undefined {
  if (!match) {
    return undefined;
  }

  let enriched = mergeMoneylineFromGammaEvent(match, event);
  enriched = syncFixtureMoneylineGroup(enriched);

  if (!enriched.polymarket) {
    return enriched;
  }

  const homeName = enriched.homeDisplayName ?? enriched.homeSeed ?? "Home";
  const awayName = enriched.awayDisplayName ?? enriched.awaySeed ?? "Away";
  const fixtureMarkets = mapEventSportsMarkets(
    event.markets ?? [],
    homeName,
    awayName,
    enriched.polymarket.moneyline.outcomes,
    enriched.polymarket.slug ?? enriched.id,
  );

  if (
    !fixtureMarkets.lines.length &&
    !fixtureMarkets.exactScores.length &&
    !fixtureMarkets.halftime.length
  ) {
    return enriched;
  }

  return {
    ...enriched,
    polymarket: {
      ...enriched.polymarket,
      fixtureMarkets,
    },
  };
}
