"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { useMarketWsContext, useMarketWsPrices } from "@/context/market-ws";
import { getPolymarketMarketWsClient } from "@/lib/market/polymarket-market-ws-client";
import { buildMarketTokenKey } from "@/lib/market/market-token-ids";
import type {
  PolymarketMarketWsEvent,
  TokenBestPrices,
} from "@/types/polymarket-market-ws";

export { buildMarketTokenKey } from "@/lib/market/market-token-ids";

export interface UseMarketTokenPricesOptions {
  enabled?: boolean;
  customFeatureEnabled?: boolean;
}

export interface UseMarketTokenPricesResult {
  pricesByTokenId: Record<string, TokenBestPrices>;
  connected: boolean;
}

function updateConnectedIfChanged(
  setValue: Dispatch<SetStateAction<boolean>>,
  value: boolean
): void {
  setValue((previous) => (previous === value ? previous : value));
}

export function useMarketTokenPrices(
  tokenIds: Array<string | undefined>,
  options: UseMarketTokenPricesOptions = {}
): UseMarketTokenPricesResult {
  const { enabled = true, customFeatureEnabled = true } = options;
  const tokenKey = buildMarketTokenKey(tokenIds);
  const marketWsContext = useMarketWsContext();
  const providerPrices = useMarketWsPrices(tokenIds);

  const [pricesByTokenId, setPricesByTokenId] = useState<
    Record<string, TokenBestPrices>
  >({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (marketWsContext) {
      return;
    }

    const activeTokenIds = tokenKey ? tokenKey.split("|") : [];

    if (!enabled || activeTokenIds.length === 0) {
      setPricesByTokenId((current) =>
        Object.keys(current).length === 0 ? current : {}
      );
      updateConnectedIfChanged(setConnected, false);
      return;
    }

    const client = getPolymarketMarketWsClient();

    const syncFromCache = () => {
      const next: Record<string, TokenBestPrices> = {};

      for (const tokenId of activeTokenIds) {
        const cached = client.getTokenPrices(tokenId);

        if (cached) {
          next[tokenId] = cached;
        }
      }

      setPricesByTokenId((current) => {
        const currentKey = Object.keys(current).sort().join("|");
        const nextKey = Object.keys(next).sort().join("|");

        if (currentKey !== nextKey) {
          return next;
        }

        for (const tokenId of activeTokenIds) {
          const currentPrices = current[tokenId];
          const nextPrices = next[tokenId];

          if (
            currentPrices?.bestBid !== nextPrices?.bestBid ||
            currentPrices?.bestAsk !== nextPrices?.bestAsk ||
            currentPrices?.lastTradePrice !== nextPrices?.lastTradePrice
          ) {
            return next;
          }
        }

        return current;
      });
    };

    const handleEvent = (event: PolymarketMarketWsEvent) => {
      const assetIds = new Set<string>();

      switch (event.event_type) {
        case "book":
          assetIds.add(event.asset_id);
          break;
        case "last_trade_price":
        case "best_bid_ask":
        case "tick_size_change":
          assetIds.add(event.asset_id);
          break;
        case "price_change":
          for (const change of event.price_changes) {
            assetIds.add(change.asset_id);
          }
          break;
        default:
          break;
      }

      const touched = activeTokenIds.some((tokenId) => assetIds.has(tokenId));

      if (!touched) {
        return;
      }

      setPricesByTokenId((current) => {
        const next = { ...current };
        let changed = false;

        for (const tokenId of activeTokenIds) {
          if (!assetIds.has(tokenId)) {
            continue;
          }

          const cached = client.getTokenPrices(tokenId);

          if (!cached) {
            continue;
          }

          const existing = current[tokenId];

          if (
            existing?.bestBid !== cached.bestBid ||
            existing?.bestAsk !== cached.bestAsk ||
            existing?.lastTradePrice !== cached.lastTradePrice
          ) {
            next[tokenId] = cached;
            changed = true;
          }
        }

        return changed ? next : current;
      });
    };

    syncFromCache();

    const unsubscribeEvents = client.subscribe(activeTokenIds, handleEvent, {
      customFeatureEnabled,
    });
    const unsubscribeConnection = client.onConnectionChange((next) => {
      updateConnectedIfChanged(setConnected, next);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeConnection();
    };
  }, [customFeatureEnabled, enabled, marketWsContext, tokenKey]);

  if (marketWsContext) {
    return {
      pricesByTokenId: enabled ? providerPrices.pricesByTokenId : {},
      connected: enabled ? providerPrices.connected : false,
    };
  }

  return {
    pricesByTokenId,
    connected,
  };
}
