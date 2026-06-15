"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import type { GameMarketTabId } from "@/views/trade/game/markets/fixture-market-actions";

interface UseGameTradingMetadataInput {
  initialMatch: WorldCupMatch;
  initialGameSnapshot: GameMarketSnapshot;
  initialFixtureMarkets: GameFixtureMarketsSnapshot;
}

interface UseGameTradingMetadataResult {
  match: WorldCupMatch;
  gameSnapshot: GameMarketSnapshot;
  fixtureMarkets: GameFixtureMarketsSnapshot;
  isTabTradingReady: (tab: GameMarketTabId) => boolean;
}

function tabTradingDataLoaded(
  tab: GameMarketTabId,
  match: WorldCupMatch,
  fixtureMarkets: GameFixtureMarketsSnapshot,
): boolean {
  if (tab === "moneyline") {
    const outcomes = match.polymarket?.moneyline.outcomes ?? [];

    return outcomes.length >= 3 && outcomes.every((outcome) => Boolean(outcome.tokenId));
  }

  if (tab === "totals") {
    return fixtureMarkets.lines.some((group) => group.type === "total");
  }

  if (tab === "spreads") {
    return fixtureMarkets.lines.some((group) => group.type === "spread");
  }

  if (tab === "halftime") {
    return fixtureMarkets.halftime.length > 0;
  }

  if (tab === "top_scores") {
    return fixtureMarkets.exactScores.length > 0;
  }

  return false;
}

export function useGameTradingMetadata({
  initialMatch,
  initialGameSnapshot,
  initialFixtureMarkets
}: UseGameTradingMetadataInput): UseGameTradingMetadataResult {
  const [match, setMatch] = useState(initialMatch);
  const [gameSnapshot, setGameSnapshot] = useState(initialGameSnapshot);
  const [fixtureMarkets, setFixtureMarkets] = useState(initialFixtureMarkets);

  useEffect(() => {
    setMatch(initialMatch);
    setGameSnapshot(initialGameSnapshot);
    setFixtureMarkets(initialFixtureMarkets);
  }, [initialFixtureMarkets, initialGameSnapshot, initialMatch]);

  const isTabTradingReady = useCallback(
    (tab: GameMarketTabId) => tabTradingDataLoaded(tab, match, fixtureMarkets),
    [fixtureMarkets, match]
  );

  return useMemo(
    () => ({
      match,
      gameSnapshot,
      fixtureMarkets,
      isTabTradingReady
    }),
    [fixtureMarkets, gameSnapshot, isTabTradingReady, match]
  );
}
