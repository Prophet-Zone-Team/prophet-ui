"use client";

import { useContext } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/tracking";

import { AnalyticsContext } from "./analytics-context";

export function useAnalytics() {
  const context = useContext(AnalyticsContext);

  return {
    track: context?.track ?? trackAnalyticsEvent
  };
}
