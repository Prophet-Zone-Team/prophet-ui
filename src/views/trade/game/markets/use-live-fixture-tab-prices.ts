"use client";

import { useCallback, useEffect, useState } from "react";

import type { LiveOutcomePrices } from "@/lib/market/fixture-live-prices";
import type { GameMarketTabId } from "@/views/trade/game/markets/fixture-market-actions";

// Live price updates will be driven by Polymarket WebSocket subscriptions instead of HTTP polling.

interface FixtureLivePricesResponse {
  matchSlug: string;
  tab: GameMarketTabId;
  lineKey?: string;
  prices: Record<string, LiveOutcomePrices>;
  updatedAt: string;
  error?: string;
}

export interface UseLiveFixtureTabPricesOptions {
  matchSlug: string;
  tab: GameMarketTabId;
  lineKey?: string;
  enabled: boolean;
}

export interface UseLiveFixtureTabPricesResult {
  pricesByOutcomeId: Record<string, LiveOutcomePrices>;
  lastUpdated?: string;
}

export function useLiveFixtureTabPrices({
  matchSlug,
  tab,
  lineKey,
  enabled,
}: UseLiveFixtureTabPricesOptions): UseLiveFixtureTabPricesResult {
  const [pricesByOutcomeId, setPricesByOutcomeId] = useState<
    Record<string, LiveOutcomePrices>
  >({});
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();

  const fetchPrices = useCallback(
    async (signal?: AbortSignal) => {
      const params = new URLSearchParams({
        matchSlug,
        tab,
      });

      if (lineKey) {
        params.set("lineKey", lineKey);
      }

      const response = await fetch(`/api/market/fixture-live-prices?${params}`, {
        cache: "no-store",
        signal,
      });
      const payload = (await response.json()) as FixtureLivePricesResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load live fixture prices.");
      }

      setPricesByOutcomeId(payload.prices ?? {});
      setLastUpdated(payload.updatedAt);
    },
    [lineKey, matchSlug, tab],
  );

  useEffect(() => {
    if (!enabled) {
      setPricesByOutcomeId({});
      setLastUpdated(undefined);
      return;
    }

    const controller = new AbortController();

    void fetchPrices(controller.signal).catch(() => {
      // Keep previous prices on transient fetch failures.
    });

    return () => {
      controller.abort();
    };
  }, [enabled, fetchPrices]);

  return {
    pricesByOutcomeId,
    lastUpdated,
  };
}
