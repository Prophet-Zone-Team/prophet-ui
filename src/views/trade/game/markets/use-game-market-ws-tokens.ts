"use client";

import { useMemo } from "react";

import { useRegisterMarketWsTokens } from "@/context/market-ws";
import { findGameMarketOutcome } from "@/lib/market/game-outcome-price";
import {
  useSelectedFixtureOutcome,
  useTradeMatchOutcomeSide,
  useTradeOutcomeSide,
} from "@/store/trade-ticket-store";
import type { FixtureMarketOutcome, GameMarketSnapshot } from "@/types/market";
import { resolveOrderbookTokenId } from "@/views/trade/game/markets/fixture-market-actions";

export interface UseGameMarketWsTokensOptions {
  activeTabOutcomes: FixtureMarketOutcome[];
  gameSnapshot: GameMarketSnapshot;
  enabled: boolean;
}

export function useGameMarketWsTokens({
  activeTabOutcomes,
  gameSnapshot,
  enabled,
}: UseGameMarketWsTokensOptions): void {
  const selectedFixtureOutcome = useSelectedFixtureOutcome();
  const tradeOutcomeSide = useTradeOutcomeSide();
  const matchOutcomeSide = useTradeMatchOutcomeSide();

  const orderbookTokenId = useMemo(() => {
    const fallbackOutcome = findGameMarketOutcome(
      gameSnapshot.outcomes,
      matchOutcomeSide
    );

    return resolveOrderbookTokenId(
      selectedFixtureOutcome,
      tradeOutcomeSide,
      fallbackOutcome
        ? {
            tokenId: fallbackOutcome.tokenId,
            noTokenId: fallbackOutcome.noTokenId,
          }
        : undefined
    );
  }, [
    gameSnapshot.outcomes,
    matchOutcomeSide,
    selectedFixtureOutcome,
    tradeOutcomeSide,
  ]);

  const tokenIds = useMemo(() => {
    const ids = activeTabOutcomes.flatMap((outcome) => [
      outcome.tokenId,
      outcome.noTokenId,
    ]);

    if (orderbookTokenId) {
      ids.push(orderbookTokenId);
    }

    return ids;
  }, [activeTabOutcomes, orderbookTokenId]);

  useRegisterMarketWsTokens("game-markets", tokenIds, { enabled });
}
