"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  useMarketWsPrices,
  useRegisterMarketWsTokens
} from "@/context/market-ws";
import { mergeFixtureOutcomeLiveAsks } from "@/lib/market/fixture-ask-liquidity";
import {
  isValidAskPrice,
  resolveFixtureDisplayAskPrice
} from "@/lib/market/fixture-ask-liquidity";
import {
  resolveLineOutcomePair,
  resolveLineOutcomeTradeBinarySide,
  resolveLineOutcomeTradeTokenId,
} from "@/lib/market/fixture-line-outcome-pair";
import { getOutcomeProbability } from "@/lib/market/game-market-snapshot";
import {
  findGameMarketOutcome,
  resolveGameOutcomeTradePrice
} from "@/lib/market/game-outcome-price";
import { calculateReferencePrice } from "@/lib/market/order-math";
import {
  resolveFixtureOutcomeDisplayProbability,
  resolveLiveOutcomeYesNoProbabilities
} from "@/lib/market/merge-live-outcome-prices";
import {
  useSelectedFixtureOutcome,
  useTradeMatchOutcomeSide
} from "@/store/trade-ticket-store";
import type {
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
  GameMarketSnapshot
} from "@/types/market";
import { resolveFixtureOutcomeLabel } from "@/views/trade/trade-widget/trade-i18n";

function resolveOutcomeButtonPrice(
  tokenId: string | undefined,
  tokenPrices: Record<
    string,
    { bestAsk?: number; bestBid?: number } | undefined
  >,
  binarySide: "yes" | "no",
  fixtureOutcome: FixtureMarketOutcome | null | undefined,
  matchOutcome: ReturnType<typeof findGameMarketOutcome>,
  matchProbability: number
): number {
  const livePrice = tokenId ? tokenPrices[tokenId]?.bestAsk : undefined;

  if (isValidAskPrice(livePrice)) {
    return livePrice;
  }

  if (fixtureOutcome) {
    const fromFixture = resolveFixtureDisplayAskPrice(fixtureOutcome, binarySide);

    if (fromFixture !== undefined) {
      return fromFixture;
    }
  }

  return resolveGameOutcomeTradePrice(
    matchOutcome,
    matchProbability,
    binarySide,
    "buy"
  );
}

export function useGameMobileOutcomePrices(
  gameSnapshot: GameMarketSnapshot,
  fixtureMarkets: GameFixtureMarketsSnapshot | undefined,
  marketWsEnabled: boolean
) {
  const t = useTranslations("trade");
  const selectedFixtureOutcome = useSelectedFixtureOutcome();
  const matchOutcomeSide = useTradeMatchOutcomeSide();
  const fixtureWsEnabled = marketWsEnabled && Boolean(selectedFixtureOutcome);

  useRegisterMarketWsTokens(
    "game-mobile-outcome-prices",
    fixtureWsEnabled
      ? [selectedFixtureOutcome?.tokenId, selectedFixtureOutcome?.noTokenId]
      : [],
    { enabled: fixtureWsEnabled }
  );

  const { pricesByTokenId: fixtureTokenPrices } = useMarketWsPrices(
    fixtureWsEnabled
      ? [selectedFixtureOutcome?.tokenId, selectedFixtureOutcome?.noTokenId]
      : []
  );

  return useMemo(() => {
    const liveFixtureAsks = selectedFixtureOutcome
      ? (() => {
          const yesPrices = selectedFixtureOutcome.tokenId
            ? fixtureTokenPrices[selectedFixtureOutcome.tokenId]
            : undefined;
          const noPrices = selectedFixtureOutcome.noTokenId
            ? fixtureTokenPrices[selectedFixtureOutcome.noTokenId]
            : undefined;
          const yesAsk = yesPrices?.bestAsk;
          const noAsk = noPrices?.bestAsk;
          const yesBid = yesPrices?.bestBid;
          const noBid = noPrices?.bestBid;

          if (
            yesAsk === undefined &&
            noAsk === undefined &&
            yesBid === undefined &&
            noBid === undefined
          ) {
            return undefined;
          }

          return { yesAsk, noAsk, yesBid, noBid };
        })()
      : undefined;

    const effectiveFixtureOutcome = selectedFixtureOutcome
      ? mergeFixtureOutcomeLiveAsks(selectedFixtureOutcome, liveFixtureAsks)
      : undefined;

    const resolvedFixtureMarkets =
      fixtureMarkets ??
      (gameSnapshot.match.polymarket?.fixtureMarkets
        ? {
            matchId: gameSnapshot.match.id,
            lines: gameSnapshot.match.polymarket.fixtureMarkets.lines,
            exactScores: gameSnapshot.match.polymarket.fixtureMarkets.exactScores,
            halftime: gameSnapshot.match.polymarket.fixtureMarkets.halftime,
            freshness: gameSnapshot.match.freshness,
          }
        : undefined);

    const lineOutcomePair =
      effectiveFixtureOutcome && resolvedFixtureMarkets
        ? resolveLineOutcomePair(effectiveFixtureOutcome, resolvedFixtureMarkets)
        : undefined;

    const mergedYesLineOutcome = lineOutcomePair
      ? mergeFixtureOutcomeLiveAsks(lineOutcomePair.yesOutcome, liveFixtureAsks)
      : undefined;
    const mergedNoLineOutcome = lineOutcomePair
      ? mergeFixtureOutcomeLiveAsks(lineOutcomePair.noOutcome, liveFixtureAsks)
      : undefined;

    const liveProbabilities = effectiveFixtureOutcome
      ? resolveLiveOutcomeYesNoProbabilities(effectiveFixtureOutcome)
      : undefined;
    const matchProbability =
      liveProbabilities?.yes ??
      getOutcomeProbability(gameSnapshot, matchOutcomeSide);
    const matchOutcome = effectiveFixtureOutcome
      ? undefined
      : findGameMarketOutcome(gameSnapshot.outcomes, matchOutcomeSide);
    const yesLineProbability = mergedYesLineOutcome
      ? resolveFixtureOutcomeDisplayProbability(mergedYesLineOutcome)
      : undefined;
    const noLineProbability = mergedNoLineOutcome
      ? resolveFixtureOutcomeDisplayProbability(mergedNoLineOutcome)
      : undefined;

    const yesPrice =
      (lineOutcomePair && mergedYesLineOutcome
        ? resolveOutcomeButtonPrice(
            resolveLineOutcomeTradeTokenId(mergedYesLineOutcome),
            fixtureTokenPrices,
            resolveLineOutcomeTradeBinarySide(mergedYesLineOutcome),
            mergedYesLineOutcome,
            matchOutcome,
            yesLineProbability ?? matchProbability
          )
        : resolveOutcomeButtonPrice(
            effectiveFixtureOutcome?.tokenId,
            fixtureTokenPrices,
            "yes",
            effectiveFixtureOutcome,
            matchOutcome,
            matchProbability
          )) ?? calculateReferencePrice(matchProbability, "yes");

    const noPrice =
      (lineOutcomePair && mergedNoLineOutcome
        ? resolveOutcomeButtonPrice(
            resolveLineOutcomeTradeTokenId(mergedNoLineOutcome),
            fixtureTokenPrices,
            resolveLineOutcomeTradeBinarySide(mergedNoLineOutcome),
            mergedNoLineOutcome,
            matchOutcome,
            noLineProbability ?? Math.max(0, 100 - matchProbability)
          )
        : resolveOutcomeButtonPrice(
            effectiveFixtureOutcome?.noTokenId,
            fixtureTokenPrices,
            "no",
            effectiveFixtureOutcome,
            matchOutcome,
            matchProbability
          )) ??
      calculateReferencePrice(
        noLineProbability ??
          liveProbabilities?.no ??
          Math.max(0, 100 - matchProbability),
        "no"
      );

    return {
      yesPrice,
      noPrice,
      yesLabel: lineOutcomePair
        ? resolveFixtureOutcomeLabel(t, lineOutcomePair.yesOutcome)
        : undefined,
      noLabel: lineOutcomePair
        ? resolveFixtureOutcomeLabel(t, lineOutcomePair.noOutcome)
        : undefined,
      selectedOutcomeLabel: effectiveFixtureOutcome
        ? resolveFixtureOutcomeLabel(t, effectiveFixtureOutcome)
        : undefined,
    };
  }, [
    fixtureMarkets,
    fixtureTokenPrices,
    gameSnapshot,
    matchOutcomeSide,
    selectedFixtureOutcome,
    t,
  ]);
}
