"use client";

import { useCallback, useEffect } from "react";

import {
  useComboMarketsError,
  useComboMarketsList,
  useComboMarketsNextCursor,
  useComboMarketsStatus,
  useComboMarketsStore,
} from "@/store/combo-markets-store";
import { useComboMarketsHydrated } from "@/store/use-combo-markets-hydrated";
import type { ComboMarketRecord } from "@/types/combo";

export interface UseComboMarketsOptions {
  limit?: number;
  enabled?: boolean;
}

export interface UseComboMarketsResult {
  markets: ComboMarketRecord[];
  nextCursor?: string | null;
  loading: boolean;
  error: string | undefined;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useComboMarkets(
  options: UseComboMarketsOptions = {},
): UseComboMarketsResult {
  const { limit = 50, enabled = true } = options;
  const hydrated = useComboMarketsHydrated();
  const markets = useComboMarketsList();
  const nextCursor = useComboMarketsNextCursor();
  const status = useComboMarketsStatus();
  const error = useComboMarketsError();
  const fetchMarkets = useComboMarketsStore((state) => state.fetchMarkets);
  const loadMoreMarkets = useComboMarketsStore((state) => state.loadMore);
  const abort = useComboMarketsStore((state) => state.abort);

  useEffect(() => {
    if (!enabled) {
      abort();
      useComboMarketsStore.setState({
        markets: [],
        nextCursor: undefined,
        status: "idle",
        error: undefined,
      });
      return;
    }

    if (!hydrated) {
      return;
    }

    const hasCache = useComboMarketsStore.getState().markets.length > 0;
    void fetchMarkets({ limit, silent: hasCache });

    return () => {
      abort();
    };
  }, [abort, enabled, fetchMarkets, hydrated, limit]);

  const reload = useCallback(async () => {
    const hasCache = useComboMarketsStore.getState().markets.length > 0;
    await fetchMarkets({ limit, silent: hasCache });
  }, [fetchMarkets, limit]);

  const loadMore = useCallback(async () => {
    await loadMoreMarkets(limit);
  }, [limit, loadMoreMarkets]);

  const loading =
    enabled && (!hydrated || (status === "loading" && markets.length === 0));

  return {
    markets: enabled ? markets : [],
    nextCursor: enabled ? nextCursor : undefined,
    loading,
    error: enabled ? error : undefined,
    loadMore,
    reload,
  };
}
