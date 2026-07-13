"use client";

import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { getCopyTraderSummary } from "@/service/copy-trade";
import type { CopyTraderPnLSummary } from "@/types/copy-trade-api";

export const COPY_TRADE_TRADER_SUMMARY_QUERY_KEY = [
  "copy-trade",
  "trader-summary"
] as const;

export async function fetchCopyTradeTraderSummary(): Promise<CopyTraderPnLSummary> {
  return getCopyTraderSummary();
}

export interface UseCopyTradeTraderSummaryOptions {
  enabled?: boolean;
}

export function useCopyTradeTraderSummary(
  options?: UseCopyTradeTraderSummaryOptions
) {
  return useQuery({
    queryKey: COPY_TRADE_TRADER_SUMMARY_QUERY_KEY,
    queryFn: fetchCopyTradeTraderSummary,
    enabled: options?.enabled ?? true,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });
}
