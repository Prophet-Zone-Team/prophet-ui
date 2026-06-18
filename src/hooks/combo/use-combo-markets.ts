"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchComboMarkets } from "@/lib/combo/markets-client";
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
  const [markets, setMarkets] = useState<ComboMarketRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const abortRef = useRef<AbortController | undefined>(undefined);
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(
    async (cursor?: string, append = false) => {
      if (!enabled) {
        setMarkets([]);
        setNextCursor(undefined);
        setLoading(false);
        setError(undefined);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(undefined);

      try {
        const response = await fetchComboMarkets({
          limit,
          cursor,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setMarkets((previous) =>
          append ? [...previous, ...response.markets] : response.markets,
        );
        setNextCursor(response.nextCursor ?? null);
      } catch (fetchError) {
        if (controller.signal.aborted || isAbortError(fetchError)) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : String(fetchError));

        if (!append) {
          setMarkets([]);
          setNextCursor(undefined);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [enabled, limit],
  );

  const reload = useCallback(async () => {
    await loadPage(undefined, false);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current) {
      return;
    }

    loadingMoreRef.current = true;

    try {
      await loadPage(nextCursor, true);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [loadPage, nextCursor]);

  useEffect(() => {
    void reload();

    return () => {
      abortRef.current?.abort();
    };
  }, [reload]);

  return {
    markets,
    nextCursor,
    loading,
    error,
    loadMore,
    reload,
  };
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
