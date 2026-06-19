"use client";

import { useMemo } from "react";

import {
  useMarketWsContext,
  useRegisterMarketWsTokens,
} from "@/context/market-ws";
import {
  buildMarketTokenKey,
  useMarketTokenPrices,
} from "@/hooks/market/use-market-token-prices";
import type { ComboMarketRecord } from "@/types/combo";

export interface UseComboLivePricesOptions {
  markets: ComboMarketRecord[];
  enabled?: boolean;
}

export interface UseComboLivePricesResult {
  liveYesPriceByMarketId: Record<string, number>;
}

export function useComboLivePrices({
  markets,
  enabled = true,
}: UseComboLivePricesOptions): UseComboLivePricesResult {
  const marketWsContext = useMarketWsContext();
  const revision = marketWsContext?.revision ?? 0;
  const tokenIds = useMemo(
    () => markets.map((market) => market.positionIds[0]),
    [markets],
  );
  const tokenKey = buildMarketTokenKey(tokenIds);

  useRegisterMarketWsTokens("combo-market-prices", tokenIds, { enabled });

  const { pricesByTokenId } = useMarketTokenPrices(
    tokenKey ? tokenKey.split("|") : [],
    {
      enabled,
      customFeatureEnabled: true,
    },
  );

  const liveYesPriceByMarketId = useMemo(() => {
    const prices: Record<string, number> = {};

    for (const market of markets) {
      const tokenId = market.positionIds[0];
      const bestAsk = tokenId ? pricesByTokenId[tokenId]?.bestAsk : undefined;

      if (typeof bestAsk === "number" && Number.isFinite(bestAsk) && bestAsk > 0) {
        prices[market.id] = bestAsk;
      }
    }

    return prices;
  }, [markets, pricesByTokenId, revision]);

  return { liveYesPriceByMarketId };
}
