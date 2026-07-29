import { cache } from "react";
import { notFound } from "next/navigation";

import { buildFixtureMarketsSnapshot } from "@/lib/market/build-fixture-markets-snapshot";
import { buildGameMarketSnapshot } from "@/lib/market/game-market-snapshot";
import {
  mapProphetGameDetailToMatch,
  resolveProphetGameSiblingEventSlugs,
} from "@/lib/market/prophet-game-detail-mapper";
import {
  fetchPolymarketGamma,
  PolymarketGammaNotFoundError
} from "@/lib/market/polymarket-gamma-fetch";
import type { GammaMarketRecord } from "@/lib/market/polymarket-gamma";
import { mapGammaMarketToTeamSnapshot } from "@/lib/market/winner-event-mapper";
import type { ProphetPolyMarketGameDetail } from "@/types/prophet-api";
import type {
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  WorldCupMatch,
} from "@/types/market";
import { getProphetGame } from "@/service/prophet";
import TradeGameView from "@/views/trade/game";
import TradeTeamView from "@/views/trade/team";

export type GameTradeContext = {
  slug: string;
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  siblingEventSlugs: ReturnType<typeof resolveProphetGameSiblingEventSlugs>;
  tracked: ProphetPolyMarketGameDetail["tracked"];
};

export const loadGameTradeContext = cache(async (slug: string): Promise<GameTradeContext> => {
  let detail;

  try {
    detail = await getProphetGame(slug);
  } catch {
    notFound();
  }

  console.log("detail", detail);

  if (!detail) {
    notFound();
  }

  const match = mapProphetGameDetailToMatch(detail);

  if (!match) {
    notFound();
  }

  return {
    slug,
    match,
    gameSnapshot: buildGameMarketSnapshot(match, []),
    fixtureMarkets: buildFixtureMarketsSnapshot(match),
    siblingEventSlugs: resolveProphetGameSiblingEventSlugs(detail),
    tracked: detail.tracked,
  };
});

export async function renderGameTradePage(slug: string) {
  const context = await loadGameTradeContext(slug);

  return (
    <TradeGameView
      key={slug}
      match={context.match}
      snapshots={[]}
      gameSnapshot={context.gameSnapshot}
      fixtureMarkets={context.fixtureMarkets}
      siblingEventSlugs={context.siblingEventSlugs}
      tracked={context.tracked}
    />
  );
}

export async function renderTeamTradePage(slug: string) {
  let market: GammaMarketRecord | undefined;

  try {
    market = await fetchPolymarketGamma<GammaMarketRecord>(
      `/markets/slug/${encodeURIComponent(slug)}`
    );
  } catch (error) {
    if (error instanceof PolymarketGammaNotFoundError) {
      notFound();
    }

    throw error;
  }

  const snapshot = mapGammaMarketToTeamSnapshot(market, { expectedSlug: slug });

  if (!snapshot) {
    notFound();
  }

  return <TradeTeamView snapshot={snapshot} />;
}
