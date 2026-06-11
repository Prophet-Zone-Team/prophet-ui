"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode
} from "react";

import {
  initializeAnalyticsIdentity,
  trackAnalyticsEvent,
  trackPageViewed
} from "@/lib/analytics/tracking";
import { resolveAnalyticsPagePath } from "@/lib/analytics/tracking/resolve-page-path";

import { AnalyticsContext } from "./analytics-context";

type AnalyticsProviderProps = {
  children: ReactNode;
};

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const identityInitializedRef = useRef(false);

  const track = useCallback(
    (input: Parameters<typeof trackAnalyticsEvent>[0]) => {
      trackAnalyticsEvent(input);
    },
    []
  );

  const value = useMemo(() => ({ track }), [track]);

  useLayoutEffect(() => {
    if (!identityInitializedRef.current) {
      identityInitializedRef.current = true;
      initializeAnalyticsIdentity();
    }

    const path = resolveAnalyticsPagePath(pathname);

    if (!path) {
      return;
    }

    trackPageViewed(path);
  }, [pathname]);

  return (
    <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
  );
}
