"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { listCopyTraderTracks } from "@/service/copy-trade";
import type { TraderCatalogEntry } from "@/types/copy-trade-api";

import { useCopyTradeSession } from "./use-copy-trade-session";

export function copyTradeTracksQueryKey(userId: number) {
  return ["copy-trade", "tracks", userId] as const;
}

export interface UseCopyTradeTracksOptions {
  enabled?: boolean;
}

export function useCopyTradeTracks(options?: UseCopyTradeTracksOptions) {
  const { hydrated, userId } = useCopyTradeSession();
  const canFetch = Boolean(hydrated && userId);
  const enabled = (options?.enabled ?? true) && canFetch;

  const query = useQuery({
    queryKey: userId
      ? copyTradeTracksQueryKey(userId)
      : ["copy-trade", "tracks", "anonymous"],
    queryFn: async (): Promise<TraderCatalogEntry[]> => {
      if (!userId) {
        throw new Error("Copy-trade session is required.");
      }

      const response = await listCopyTraderTracks();
      return response.items ?? [];
    },
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
  });

  const trackedWallets = useMemo(() => {
    const wallets = new Set<string>();
    for (const trader of query.data ?? []) {
      wallets.add(trader.Wallet.toLowerCase());
    }
    return wallets;
  }, [query.data]);

  return {
    tracks: query.data ?? [],
    trackedWallets,
    isLoading: enabled && query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasSession: canFetch,
    hydrated,
  };
}
