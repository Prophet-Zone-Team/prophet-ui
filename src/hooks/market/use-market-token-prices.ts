"use client";

import { useEffect, useMemo, useState } from "react";

import { getPolymarketMarketWsClient } from "@/lib/market/polymarket-market-ws-client";
import type {
  PolymarketMarketWsEvent,
  TokenBestPrices,
} from "@/types/polymarket-market-ws";

export interface UseMarketTokenPricesOptions {
  enabled?: boolean;
  customFeatureEnabled?: boolean;
}

export interface UseMarketTokenPricesResult {
  pricesByTokenId: Record<string, TokenBestPrices>;
  connected: boolean;
}

function normalizeTokenIds(tokenIds: Array<string | undefined>): string[] {
  const unique = new Set<string>();

  for (const tokenId of tokenIds) {
    if (tokenId) {
      unique.add(tokenId);
    }
  }

  return [...unique];
}

export function useMarketTokenPrices(
  tokenIds: Array<string | undefined>,
  options: UseMarketTokenPricesOptions = {}
): UseMarketTokenPricesResult {
  const { enabled = true, customFeatureEnabled = true } = options;
  const normalizedTokenIds = useMemo(
    () => normalizeTokenIds(tokenIds),
    [tokenIds]
  );
  const tokenKey = normalizedTokenIds.join("|");

  const [pricesByTokenId, setPricesByTokenId] = useState<
    Record<string, TokenBestPrices>
  >({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled || normalizedTokenIds.length === 0) {
      setPricesByTokenId({});
      setConnected(false);
      return;
    }

    const client = getPolymarketMarketWsClient();
    const activeTokenIds = normalizedTokenIds;

    const syncFromCache = () => {
      const next: Record<string, TokenBestPrices> = {};

      for (const tokenId of activeTokenIds) {
        const cached = client.getTokenPrices(tokenId);

        if (cached) {
          next[tokenId] = cached;
        }
      }

      setPricesByTokenId(next);
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

        for (const tokenId of activeTokenIds) {
          if (!assetIds.has(tokenId)) {
            continue;
          }

          const cached = client.getTokenPrices(tokenId);

          if (cached) {
            next[tokenId] = cached;
          }
        }

        return next;
      });
    };

    syncFromCache();

    const unsubscribeEvents = client.subscribe(activeTokenIds, handleEvent, {
      customFeatureEnabled,
    });
    const unsubscribeConnection = client.onConnectionChange(setConnected);

    return () => {
      unsubscribeEvents();
      unsubscribeConnection();
    };
  }, [customFeatureEnabled, enabled, tokenKey, normalizedTokenIds]);

  return {
    pricesByTokenId,
    connected,
  };
}
