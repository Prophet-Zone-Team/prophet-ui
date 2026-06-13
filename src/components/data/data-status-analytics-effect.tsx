"use client";

import { useEffect, useRef } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import { trackFallbackDataUsed } from "@/lib/analytics/tracking";

type DataStatusAnalyticsEffectProps = {
  meta: MarketDataMeta;
};

export function DataStatusAnalyticsEffect({ meta }: DataStatusAnalyticsEffectProps) {
  const reportedRef = useRef<string | null>(null);

  useEffect(() => {
    if (meta.status === "live") {
      return;
    }

    const dedupeKey = `${meta.status}:${meta.source}`;

    if (reportedRef.current === dedupeKey) {
      return;
    }

    reportedRef.current = dedupeKey;

    trackFallbackDataUsed({
      fallbackType: meta.status,
      path: typeof window !== "undefined" ? window.location.pathname : undefined
    });
  }, [meta.source, meta.status]);

  return null;
}
