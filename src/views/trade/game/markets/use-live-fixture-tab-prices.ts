"use client";

import { useMemo } from "react";

import type { LiveOutcomePrices } from "@/lib/market/fixture-live-prices";
import { useMarketTokenPrices } from "@/hooks/market/use-market-token-prices";
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

function collectOutcomeTokenIds(outcomes: FixtureMarketOutcome[]): string[] {
  const tokenIds = new Set<string>();

  for (const outcome of outcomes) {
    if (outcome.tokenId) {
      tokenIds.add(outcome.tokenId);
    }

    if (outcome.noTokenId) {
      tokenIds.add(outcome.noTokenId);
    }
  }

  return [...tokenIds];
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
  const tokenIds = useMemo(
    () => collectOutcomeTokenIds(outcomes),
    [outcomes]
  );

  const { pricesByTokenId } = useMarketTokenPrices(tokenIds, {
    enabled,
    customFeatureEnabled: true,
  });

  const pricesByOutcomeId = useMemo(
    () => mapTokenPricesToOutcomes(outcomes, pricesByTokenId),
    [outcomes, pricesByTokenId]
  );

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
