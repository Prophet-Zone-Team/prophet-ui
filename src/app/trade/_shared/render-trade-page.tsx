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
import { getProphetGame } from "@/service/prophet";
import TradeGameView from "@/views/trade/game";
import TradeTeamView from "@/views/trade/team";

export async function renderGameTradePage(slug: string) {
  let detail;

  try {
    detail = await getProphetGame(slug);
  } catch {
    notFound();
  }

  if (!detail) {
    notFound();
  }

  const match = mapProphetGameDetailToMatch(detail);

  if (!match) {
    notFound();
  }

  const siblingEventSlugs = resolveProphetGameSiblingEventSlugs(detail);
  const gameSnapshot = buildGameMarketSnapshot(match, []);
  const fixtureMarkets = buildFixtureMarketsSnapshot(match);

  return (
    <TradeGameView
      match={match}
      snapshots={[]}
      gameSnapshot={gameSnapshot}
      fixtureMarkets={fixtureMarkets}
      siblingEventSlugs={siblingEventSlugs}
      tracked={detail.tracked}
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
