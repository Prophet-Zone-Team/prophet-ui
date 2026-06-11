"use client";

import { useEffect, useRef } from "react";

import { useAnalytics } from "@/context/analytics";
import {
  hasSeenDedupeKey,
  markDedupeKeySeen,
  nextImpressionIndex
} from "@/lib/analytics/tracking";
import type {
  ProphetAnalyticsTrackEventName,
  ProphetAnalyticsTrackRequest
} from "@/types/prophet-api";

type UseAnalyticsImpressionOptions = {
  eventName: Extract<
    ProphetAnalyticsTrackEventName,
    "section_viewed" | "team_card_impressed" | "chart_viewed" | "bid_area_viewed"
  >;
  enabled?: boolean;
  dedupeKey?: string;
  minVisibleRatio?: number;
  minVisibleMs?: number;
  payload?: Omit<
    ProphetAnalyticsTrackRequest,
    "eventName" | "eventId" | "anonymousId" | "sessionId"
  >;
};

export function useAnalyticsImpression<T extends HTMLElement>(
  options: UseAnalyticsImpressionOptions
) {
  const { track } = useAnalytics();
  const elementRef = useRef<T | null>(null);
  const visibleStartedAtRef = useRef<number | null>(null);
  const reportedRef = useRef(false);

  const {
    eventName,
    enabled = true,
    dedupeKey,
    minVisibleRatio = 0.5,
    minVisibleMs = 1000,
    payload
  } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const element = elementRef.current;

    if (!element) {
      return;
    }

    if (dedupeKey && hasSeenDedupeKey(dedupeKey)) {
      reportedRef.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry || reportedRef.current) {
          return;
        }

        if (entry.isIntersecting && entry.intersectionRatio >= minVisibleRatio) {
          if (visibleStartedAtRef.current === null) {
            visibleStartedAtRef.current = Date.now();
          }

          const visibleMs = Date.now() - visibleStartedAtRef.current;

          if (visibleMs < minVisibleMs) {
            return;
          }

          reportedRef.current = true;

          if (dedupeKey) {
            markDedupeKeySeen(dedupeKey);
          }

          track({
            eventName,
            dedupeKey,
            visibleRatio: entry.intersectionRatio,
            visibleMs,
            visibleStartedAt: new Date(visibleStartedAtRef.current).toISOString(),
            impressionIndex: nextImpressionIndex(),
            ...payload
          });
          return;
        }

        visibleStartedAtRef.current = null;
      },
      { threshold: [0, minVisibleRatio, 1] }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [
    dedupeKey,
    enabled,
    eventName,
    minVisibleMs,
    minVisibleRatio,
    payload,
    track
  ]);

  return elementRef;
}
