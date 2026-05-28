"use client";

import { useMarketWsContext, useMarketWsPrices } from "@/context/market-ws";
import type { TokenBestPrices } from "@/types/polymarket-market-ws";

export { buildMarketTokenKey } from "@/lib/market/market-token-ids";

export interface UseMarketTokenPricesOptions {
  enabled?: boolean;
  customFeatureEnabled?: boolean;
}

export interface UseMarketTokenPricesResult {
  pricesByTokenId: Record<string, TokenBestPrices>;
  connected: boolean;
}

export function useMarketTokenPrices(
  tokenIds: Array<string | undefined>,
  options: UseMarketTokenPricesOptions = {}
): UseMarketTokenPricesResult {
  const { enabled = true } = options;
  const marketWsContext = useMarketWsContext();
  const providerPrices = useMarketWsPrices(tokenIds);

  if (marketWsContext) {
    return {
      pricesByTokenId: enabled ? providerPrices.pricesByTokenId : {},
      connected: enabled ? providerPrices.connected : false,
    };
  }

  return {
    pricesByTokenId: {},
    connected: false,
  };
}
