"use client";

import { createContext } from "react";

import type { AnalyticsTrackInput } from "@/lib/analytics/tracking";

export type AnalyticsContextValue = {
  track: (input: AnalyticsTrackInput) => void;
};

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);
