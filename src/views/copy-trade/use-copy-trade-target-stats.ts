"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import {
  buildCopyTargetStatsMap,
  type CopyTargetDisplayStats
} from "@/lib/copy-trade/target-stats";
import { getCopyTradePnL, listCopyTradeOrders } from "@/service/copy-trade";
import type { CopyTarget } from "@/types/copy-trade-api";

import { useCopyTradeSession } from "./use-copy-trade-session";

function copyTradeTargetStatsQueryKey(userId: number) {
  return ["copy-trade", "target-stats", userId] as const;
}

export interface UseCopyTradeTargetStatsOptions {
  enabled?: boolean;
  targets?: CopyTarget[];
}

export function useCopyTradeTargetStats(
  options?: UseCopyTradeTargetStatsOptions
) {
  const { hydrated, userId } = useCopyTradeSession();
  const targets = options?.targets ?? [];
  const canFetch = Boolean(hydrated && userId);
  const enabled =
    (options?.enabled ?? true) && canFetch && targets.length > 0;

  const targetWalletKey = useMemo(
    () =>
      targets
        .map((target) => target.Wallet.toLowerCase())
        .sort()
        .join(","),
    [targets]
  );

  const query = useQuery({
    queryKey: userId
      ? [...copyTradeTargetStatsQueryKey(userId), targetWalletKey]
      : ["copy-trade", "target-stats", "anonymous"],
    queryFn: async (): Promise<Map<string, CopyTargetDisplayStats>> => {
      if (!userId) {
        throw new Error("Copy-trade session is required.");
      }

      const [pnl, orders] = await Promise.all([
        getCopyTradePnL(userId),
        listCopyTradeOrders(userId)
      ]);

      return buildCopyTargetStatsMap(targets, pnl, orders);
    },
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const statsByWallet = useMemo(
    () => query.data ?? new Map<string, CopyTargetDisplayStats>(),
    [query.data]
  );

  return {
    statsByWallet,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch
  };
}
