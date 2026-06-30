"use client";

import { useQuery } from "@tanstack/react-query";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import { getCopyTradePnLPoints } from "@/service/copy-trade";
import type { CopyPnLPointsResponse } from "@/types/copy-trade-api";
import type { PortfolioLoadStatus } from "@/lib/portfolio/types";

import { useCopyTradeSession } from "./use-copy-trade-session";

function copyTradePnLPointsQueryKey(userId: number) {
  return ["copy-trade", "pnl-points", userId] as const;
}

export interface UseCopyTradePnLPointsOptions {
  enabled?: boolean;
}

export function useCopyTradePnLPoints(options?: UseCopyTradePnLPointsOptions) {
  const { hydrated, userId } = useCopyTradeSession();
  const canFetch = Boolean(hydrated && userId);
  const enabled = (options?.enabled ?? true) && canFetch;

  const query = useQuery({
    queryKey: userId
      ? copyTradePnLPointsQueryKey(userId)
      : ["copy-trade", "pnl-points", "anonymous"],
    queryFn: async (): Promise<CopyPnLPointsResponse> => {
      if (!userId) {
        throw new Error("Copy-trade session is required.");
      }

      return getCopyTradePnLPoints(userId);
    },
    enabled,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS,
  });

  let status: PortfolioLoadStatus = "idle";

  if (enabled && query.isLoading) {
    status = "loading";
  } else if (query.isError) {
    status = "error";
  } else if (query.data || !enabled) {
    status = "ready";
  }

  return {
    pointsResponse: query.data ?? null,
    status,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    hasSession: canFetch,
    hydrated,
  };
}
