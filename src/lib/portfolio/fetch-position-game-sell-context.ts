import { buildFixtureMarketsSnapshot } from "@/lib/market/build-fixture-markets-snapshot";
import { buildGameMarketSnapshot } from "@/lib/market/game-market-snapshot";
import { mapEventSportsMarkets } from "@/lib/market/fixture-markets-mapper";
import {
  isGammaEventPayload,
  mergeMoneylineFromGammaEvent,
  syncFixtureMoneylineGroup
} from "@/lib/market/merge-game-trading-metadata";
import { fetchPolymarket } from "@/lib/market/polymarket-api-client";
import type { GammaEventRecord, GammaMarketRecord } from "@/lib/market/polymarket-gamma";
import { mapGammaEventToMatch } from "@/lib/market/polymarket-football-match-mapper";
import { mapProphetGameDetailToMatch } from "@/lib/market/prophet-game-detail-mapper";
import {
  resolvePositionGameSellContext,
  type PositionGameSellContext
} from "@/lib/portfolio/resolve-position-game-sell-context";
import { getProphetGame } from "@/service/prophet";
import type { UserPositionRecord, WorldCupMatch } from "@/types/market";

export type { PositionGameSellContext } from "@/lib/portfolio/resolve-position-game-sell-context";

export async function fetchPositionGameSellContext(
  position: UserPositionRecord
): Promise<PositionGameSellContext | undefined> {
  const eventSlug = await resolveEventSlug(position);

  if (!eventSlug) {
    return undefined;
  }

  const match = await loadMatchForEventSlug(eventSlug);

  if (!match) {
    return undefined;
  }

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
    return undefined;
  }

  return undefined;
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
    enriched.polymarket.moneyline.outcomes
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
      fixtureMarkets
    }
  };
}
