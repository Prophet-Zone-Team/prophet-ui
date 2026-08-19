"use client";

import { useMemo } from "react";

import { buildFixtureMarketsSnapshot } from "@/lib/market/build-fixture-markets-snapshot";
import { buildGameMarketSnapshot } from "@/lib/market/game-market-snapshot";
import { useMatchWithLiveState } from "@/store/match-live-store";
import type {
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import {
  MarketsTradeMobileControls,
  MarketsTradePanel
} from "@/views/markets/markets-trade-panel";

export function useMarketsGameTradeContext(match: WorldCupMatch): {
  liveMatch: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
} {
  const liveMatch = useMatchWithLiveState(match);

  const gameSnapshot = useMemo(
    () => buildGameMarketSnapshot(liveMatch, []),
    [liveMatch]
  );

  const fixtureMarkets = useMemo(
    () => buildFixtureMarketsSnapshot(liveMatch),
    [liveMatch]
  );

  return { liveMatch, gameSnapshot, fixtureMarkets };
}

export function MarketsTradeDesktop({ match }: { match: WorldCupMatch }) {
  const { liveMatch, gameSnapshot, fixtureMarkets } =
    useMarketsGameTradeContext(match);

  return (
    <MarketsTradePanel
      match={liveMatch}
      gameSnapshot={gameSnapshot}
      fixtureMarkets={fixtureMarkets}
    />
  );
}

export function MarketsTradeMobile({ match }: { match: WorldCupMatch }) {
  const { liveMatch, gameSnapshot, fixtureMarkets } =
    useMarketsGameTradeContext(match);

  return (
    <MarketsTradeMobileControls
      match={liveMatch}
      gameSnapshot={gameSnapshot}
      fixtureMarkets={fixtureMarkets}
    />
  );
}
