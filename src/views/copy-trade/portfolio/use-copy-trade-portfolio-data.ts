"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { collectUniqueConditionIdsFromPositions } from "@/lib/portfolio/teams-condition";
import type { OpenOrderMarketContext } from "@/lib/portfolio/teams-condition";
import type { PortfolioLoadStatus } from "@/lib/portfolio/types";
import { fetchJson } from "@/lib/team/client-fetch";
import { useTeamsConditionStore } from "@/store/teams-condition-store";
import type { UserPositionRecord } from "@/types/market";

import { useCopyTradeSession } from "../use-copy-trade-session";

export interface UseCopyTradePortfolioDataResult {
  openPositions: UserPositionRecord[];
  closedPositions: UserPositionRecord[];
  marketContextMap: Record<string, OpenOrderMarketContext>;
  status: PortfolioLoadStatus;
  error?: string;
  refetch: () => Promise<void>;
}

export function useCopyTradePortfolioData(
  enabled = true
): UseCopyTradePortfolioDataResult {
  const { userId, hydrated } = useCopyTradeSession();
  const canFetch = Boolean(enabled && hydrated && userId);
  const [positions, setPositions] = useState<UserPositionRecord[]>([]);
  const [marketContextMap, setMarketContextMap] = useState<
    Record<string, OpenOrderMarketContext>
  >({});
  const [status, setStatus] = useState<PortfolioLoadStatus>("idle");
  const [error, setError] = useState<string | undefined>();
  const loadedRef = useRef(false);

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

  const loadPositions = useCallback(
    async (options?: { force?: boolean }) => {
      if (!userId) {
        return;
      }

      if (loadedRef.current && !options?.force) {
        return;
      }

      setStatus("loading");
      setError(undefined);

      try {
        const payload = await fetchJson<{ positions?: UserPositionRecord[] }>(
          `/api/copy-trade/positions?userId=${userId}&limit=100&sizeThreshold=0.1`,
          { credentials: "include" }
        );

        const nextPositions = payload.positions ?? [];
        setPositions(nextPositions);
        await ensureMarketContext(nextPositions);
        loadedRef.current = true;
        setStatus("ready");
      } catch (loadError) {
        loadedRef.current = true;
        setStatus("error");
        setError(
          loadError instanceof Error ? loadError.message : String(loadError)
        );
      }
    },
    [ensureMarketContext, userId]
  );

  useEffect(() => {
    if (!canFetch) {
      setPositions([]);
      setMarketContextMap({});
      setStatus("idle");
      setError(undefined);
      loadedRef.current = false;
      return;
    }

    void loadPositions();
  }, [canFetch, loadPositions]);

  const { openPositions, closedPositions } = useMemo(() => {
    const open: UserPositionRecord[] = [];
    const closed: UserPositionRecord[] = [];

    for (const position of positions) {
      if (position.currentValue !== 0) {
        open.push(position);
      } else {
        closed.push(position);
      }
    }

    return { openPositions: open, closedPositions: closed };
  }, [positions]);

  return {
    openPositions,
    closedPositions,
    marketContextMap,
    status: canFetch ? status : "idle",
    error,
    refetch: () => loadPositions({ force: true })
  };
}
