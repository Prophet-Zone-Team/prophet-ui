"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ANALYTICS_QUERY_STALE_TIME_MS } from "@/lib/analytics/config";
import {
  buildCopyPositionTimeMap,
  mapCopyPositionPnLToUserPositionRecord
} from "@/lib/copy-trade/map-copy-position-pnl";
import { collectUniqueConditionIdsFromPositions } from "@/lib/portfolio/teams-condition";
import type { OpenOrderMarketContext } from "@/lib/portfolio/teams-condition";
import type { PortfolioLoadStatus } from "@/lib/portfolio/types";
import { getCopyTradePnL } from "@/service/copy-trade";
import { useTeamsConditionStore } from "@/store/teams-condition-store";
import type { UserPositionRecord } from "@/types/market";

import { copyTradePnLQueryKey } from "../use-copy-trade-profile-stats";
import { useCopyTradeSession } from "../use-copy-trade-session";

export interface UseCopyTradePortfolioDataResult {
  openPositions: UserPositionRecord[];
  closedPositions: UserPositionRecord[];
  marketContextMap: Record<string, OpenOrderMarketContext>;
  positionTimeMap: Map<string, string>;
  status: PortfolioLoadStatus;
  error?: string;
  refetch: () => Promise<void>;
}

export function useCopyTradePortfolioData(
  enabled = true
): UseCopyTradePortfolioDataResult {
  const { userId, hydrated } = useCopyTradeSession();
  const canFetch = Boolean(enabled && hydrated && userId);
  const [marketContextMap, setMarketContextMap] = useState<
    Record<string, OpenOrderMarketContext>
  >({});

  const pnlQuery = useQuery({
    queryKey: userId
      ? copyTradePnLQueryKey(userId)
      : ["copy-trade", "pnl", "anonymous"],
    queryFn: async () => {
      if (!userId) {
        throw new Error("Copy-trade session is required.");
      }

      return getCopyTradePnL(userId);
    },
    enabled: canFetch,
    staleTime: ANALYTICS_QUERY_STALE_TIME_MS
  });

  const pnlSummary = pnlQuery.data ?? null;
  const proxyWallet = pnlSummary?.address ?? "";

  const openPositions = useMemo(() => {
    return (pnlSummary?.positions ?? []).map((row) =>
      mapCopyPositionPnLToUserPositionRecord(row, { proxyWallet })
    );
  }, [pnlSummary?.positions, proxyWallet]);

  const closedPositions = useMemo(() => {
    return (pnlSummary?.history ?? []).map((row) =>
      mapCopyPositionPnLToUserPositionRecord(row, { proxyWallet })
    );
  }, [pnlSummary?.history, proxyWallet]);

  const positionTimeMap = useMemo(() => {
    const rows = [
      ...(pnlSummary?.positions ?? []),
      ...(pnlSummary?.history ?? [])
    ];
    return buildCopyPositionTimeMap(rows);
  }, [pnlSummary?.history, pnlSummary?.positions]);

  const ensureMarketContext = useCallback(async (items: UserPositionRecord[]) => {
    const conditionIds = collectUniqueConditionIdsFromPositions(items);
    if (conditionIds.length === 0) {
      return;
    }

    try {
      const map = await useTeamsConditionStore
        .getState()
        .ensureTeamsCondition(conditionIds);
      setMarketContextMap((current) => ({ ...current, ...map }));
    } catch (contextError) {
      console.warn("[copy-trade portfolio] teams-condition failed", contextError);
    }
  }, []);

  useEffect(() => {
    if (!canFetch) {
      setMarketContextMap({});
      return;
    }

    if (!pnlSummary) {
      return;
    }

    void ensureMarketContext([...openPositions, ...closedPositions]);
  }, [canFetch, closedPositions, ensureMarketContext, openPositions, pnlSummary]);

  const status: PortfolioLoadStatus = !canFetch
    ? "idle"
    : pnlQuery.isError
      ? "error"
      : pnlQuery.isLoading || pnlQuery.isFetching
        ? "loading"
        : pnlQuery.isSuccess
          ? "ready"
          : "idle";

  const error =
    pnlQuery.error instanceof Error
      ? pnlQuery.error.message
      : pnlQuery.error
        ? String(pnlQuery.error)
        : undefined;

  return {
    openPositions,
    closedPositions,
    marketContextMap,
    positionTimeMap,
    status,
    error,
    refetch: async () => {
      await pnlQuery.refetch();
    }
  };
}
