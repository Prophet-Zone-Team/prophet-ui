"use client";

import { useMemo } from "react";

import {
  buildMarketTokenKey,
  useMarketTokenPrices,
} from "@/hooks/market/use-market-token-prices";
import type { LiveOutcomePrices } from "@/lib/market/fixture-live-prices";
import type { FixtureMarketOutcome } from "@/types/market";
import type { TokenBestPrices } from "@/types/polymarket-market-ws";

export interface UseLiveFixtureTabPricesOptions {
  outcomes: FixtureMarketOutcome[];
  enabled: boolean;
}

export interface UseLiveFixtureTabPricesResult {
  pricesByOutcomeId: Record<string, LiveOutcomePrices>;
  lastUpdated?: string;
}

function mapTokenPricesToOutcomes(
  outcomes: FixtureMarketOutcome[],
  pricesByTokenId: Record<string, TokenBestPrices>
): Record<string, LiveOutcomePrices> {
  const prices: Record<string, LiveOutcomePrices> = {};

  for (const outcome of outcomes) {
    const yesPrices = outcome.tokenId
      ? pricesByTokenId[outcome.tokenId]
      : undefined;
    const noPrices = outcome.noTokenId
      ? pricesByTokenId[outcome.noTokenId]
      : undefined;

    if (!yesPrices && !noPrices) {
      continue;
    }

    prices[outcome.id] = {
      yesAsk: yesPrices?.bestAsk,
      yesBid: yesPrices?.bestBid,
      noAsk: noPrices?.bestAsk,
      noBid: noPrices?.bestBid,
    };
  }

  return prices;
}

export function useLiveFixtureTabPrices({
  outcomes,
  enabled,
}: UseLiveFixtureTabPricesOptions): UseLiveFixtureTabPricesResult {
  const tokenKey = buildMarketTokenKey(
    outcomes.flatMap((outcome) => [outcome.tokenId, outcome.noTokenId])
  );

  const { pricesByTokenId } = useMarketTokenPrices(
    tokenKey ? tokenKey.split("|") : [],
    {
      enabled,
      customFeatureEnabled: true,
    }
  );

  const pricesByOutcomeId = mapTokenPricesToOutcomes(outcomes, pricesByTokenId);

  const lastUpdated = useMemo(() => {
    let latest: string | undefined;

    for (const prices of Object.values(pricesByTokenId)) {
      if (prices.updatedAt && (!latest || prices.updatedAt > latest)) {
        latest = prices.updatedAt;
      }
    }

    return latest;
  }, [pricesByTokenId]);

  return {
    pricesByOutcomeId,
    lastUpdated,
  };
}
