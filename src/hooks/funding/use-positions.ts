"use client";

import { useCallback, useEffect, useState } from "react";

import { buildPositionsView } from "../../lib/trading/positions-model";
import { fetchJson } from "../../lib/team/client-fetch";
import type { FundingLoadStatus, PositionsView } from "../../types/funding";
import type { UserPositionRecord } from "../../types/market";
import { useAuthOptional } from "../../context/auth";

export interface UsePositionsOptions {
  enabled?: boolean;
  limit?: number;
}

export interface UsePositionsResult {
  positions: UserPositionRecord[];
  summary: PositionsView["summary"];
  view: PositionsView | undefined;
  status: FundingLoadStatus;
  error: string | undefined;
  reload: () => Promise<void>;
}

export function usePositions(options: UsePositionsOptions = {}): UsePositionsResult {
  const { enabled = true, limit = 100 } = options;
  const auth = useAuthOptional();
  const session = auth?.session;
  const [view, setView] = useState<PositionsView | undefined>();
  const [status, setStatus] = useState<FundingLoadStatus>("idle");
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(async () => {
    if (!enabled) {
      return;
    }

    if (!session) {
      setView(undefined);
      setStatus("ready");
      setError(undefined);
      return;
    }

    setStatus("loading");
    setError(undefined);

    try {
      const payload = await fetchJson<{ positions?: UserPositionRecord[]; error?: string }>(
        `/api/trading/positions?limit=${limit}`,
      );

      if (payload.error) {
        throw new Error(payload.error);
      }

      setView(buildPositionsView(payload.positions ?? []));
      setStatus("ready");
    } catch (loadError) {
      setStatus("error");
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    }
  }, [enabled, limit, session]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    positions: view?.items ?? [],
    summary: view?.summary ?? { totalValueUsd: 0, totalCashPnlUsd: 0, count: 0 },
    view,
    status,
    error,
    reload,
  };
}
