"use client";

import { useEffect, useState } from "react";

import { fetchUserPnlSeries } from "@/lib/portfolio/fetch-user-pnl";
import type {
  PortfolioLoadStatus,
  PortfolioSeriesPoint,
  PortfolioTimeRange
} from "@/lib/portfolio/types";

export interface UsePortfolioUserPnlResult {
  series: PortfolioSeriesPoint[];
  status: PortfolioLoadStatus;
  error?: string;
}

export function usePortfolioUserPnl(
  userAddress: string | undefined,
  range: PortfolioTimeRange
): UsePortfolioUserPnlResult {
  const [series, setSeries] = useState<PortfolioSeriesPoint[]>([]);
  const [status, setStatus] = useState<PortfolioLoadStatus>("idle");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!userAddress?.trim()) {
      setSeries([]);
      setStatus("ready");
      setError(undefined);
      return;
    }

    let cancelled = false;

    setStatus("loading");
    setError(undefined);

    void fetchUserPnlSeries(userAddress, range, { useProxy: true })
      .then((nextSeries) => {
        if (cancelled) {
          return;
        }

        setSeries(nextSeries);
        setStatus("ready");
      })
      .catch((fetchError) => {
        if (cancelled) {
          return;
        }

        setSeries([]);
        setStatus("error");
        setError(
          fetchError instanceof Error ? fetchError.message : String(fetchError)
        );
      });

    return () => {
      cancelled = true;
    };
  }, [range, userAddress]);

  return { series, status, error };
}
