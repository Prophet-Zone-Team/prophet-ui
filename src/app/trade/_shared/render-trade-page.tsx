import { notFound } from "next/navigation";

import { getFootballMatches } from "@/data/providers/football-matches";
import { getWorldCupMarketData } from "@/data/providers/world-cup-market-data";
import type { WorldCupMarketDataOptions } from "@/data/providers/types";
import {
  buildGameMarketSnapshot,
  getRelatedMatches
} from "@/lib/market/game-market-snapshot";
import { buildFixtureMarketsSnapshot } from "@/lib/market/build-fixture-markets-snapshot";
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
import type { WorldCupMatch } from "@/types/market";
import TradeGameView from "@/views/trade/game";
import TradeTeamView from "@/views/trade/team";

function resolveGameMarketOptions(
  footballMatch: WorldCupMatch
): WorldCupMarketDataOptions {
  const footballContextTeamIds = [
    footballMatch.homeTeamId,
    footballMatch.awayTeamId
  ].filter((teamId): teamId is string => Boolean(teamId));

  return {
    includeFootballContext: Boolean(footballContextTeamIds.length),
    includeNews: false,
    includeOdds: false,
    includeHistory: false,
    footballContextTeamIds
  };
}

export async function renderGameTradePage(slug: string) {
  let detail;

  try {
    detail = await getProphetGame(slug);
  } catch {
    notFound();
  }

  const match = mapProphetGameDetailToMatch(detail);

  if (!match) {
    notFound();
  }

  const siblingEventSlugs = resolveProphetGameSiblingEventSlugs(detail);
  const { matches } = await getFootballMatches();

  const marketData = await getWorldCupMarketData(
    resolveGameMarketOptions(match)
  );
  const snapshot = buildGameMarketSnapshot(match, marketData.snapshots);
  const fixtureMarkets = buildFixtureMarketsSnapshot(match);
  const relatedMatches = getRelatedMatches(match, matches);
  const teamProfiles = Object.fromEntries(
    marketData.footballTeamContext.map((context) => [
      context.profile.teamId,
      context.profile
    ])
  );

  return (
    <TradeGameView
      match={match}
      snapshots={marketData.snapshots}
      gameSnapshot={snapshot}
      fixtureMarkets={fixtureMarkets}
      siblingEventSlugs={siblingEventSlugs}
      teamProfiles={teamProfiles}
      relatedMatches={relatedMatches.length > 0 ? relatedMatches : matches}
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
