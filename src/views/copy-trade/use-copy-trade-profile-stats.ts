"use client";

import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { getCopyTradeBalances, getCopyTradePnL } from "@/service/copy-trade";
import type { CopyPnLSummary } from "@/types/copy-trade-api";

import { useCopyTradeSession } from "./use-copy-trade-session";

function copyTradeBalanceQueryKey(userId: number) {
  return ["copy-trade", "balance", userId] as const;
}

function copyTradePnLQueryKey(userId: number) {
  return ["copy-trade", "pnl", userId] as const;
}

export interface UseCopyTradeProfileStatsOptions {
  enabled?: boolean;
}

export function useCopyTradeProfileStats(
  options?: UseCopyTradeProfileStatsOptions
) {
  const { hydrated, userId } = useCopyTradeSession();
  const canFetch = Boolean(hydrated && userId);
  const enabled = (options?.enabled ?? true) && canFetch;

  const balanceQuery = useQuery({
    queryKey: userId
      ? copyTradeBalanceQueryKey(userId)
      : ["copy-trade", "balance", "anonymous"],
    queryFn: async (): Promise<number | null> => {
      if (!userId) {
        throw new Error("Copy-trade session is required.");
      }

      const balance = await getCopyTradeBalances(userId);
      return balance.Available ?? null;
    },
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
  });

  const pnlQuery = useQuery({
    queryKey: userId
      ? copyTradePnLQueryKey(userId)
      : ["copy-trade", "pnl", "anonymous"],
    queryFn: async (): Promise<CopyPnLSummary> => {
      if (!userId) {
        throw new Error("Copy-trade session is required.");
      }

      const pnl = await getCopyTradePnL(userId);
      return pnl;
    },
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
  });

  const pnlSummaryData = pnlQuery.data ?? null;

  return {
    balance: balanceQuery.data ?? null,
    totalPnL: pnlSummaryData?.total_cash_pnl ?? null,
    positionsValue: pnlSummaryData?.total_current_value ?? null,
    openPositions: pnlSummaryData?.open_positions ?? null,
    biggestWinAmount: pnlSummaryData?.biggest_win_amount ?? null,
    pnlSummary: pnlSummaryData,
    isLoadingBalance: enabled && balanceQuery.isLoading,
    isLoadingPnL: enabled && pnlQuery.isLoading,
    isLoadingSummary: enabled && pnlQuery.isLoading,
    isError: balanceQuery.isError || pnlQuery.isError,
    refetch: async () => {
      await Promise.all([balanceQuery.refetch(), pnlQuery.refetch()]);
    },
    hasSession: canFetch,
    hydrated,
  };
}
