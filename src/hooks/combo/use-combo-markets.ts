"use client";

import { useCallback, useEffect } from "react";

import {
  getMsUntilNextCalendarDay,
  hasFreshComboMarketsSnapshot,
  resolveComboMarketsTimezone,
} from "@/lib/combo/combo-markets-cache";
import {
  useComboMarketsDay,
  useComboMarketsError,
  useComboMarketsGroups,
  useComboMarketsList,
  useComboMarketsNextCursor,
  useComboMarketsStatus,
  useComboMarketsStore,
} from "@/store/combo-markets-store";
import { useComboMarketsHydrated } from "@/store/use-combo-markets-hydrated";
import type { ComboGameGroup, ComboMarketRecord, ComboMarketsDay } from "@/types/combo";

export interface UseComboMarketsOptions {
  limit?: number;
  enabled?: boolean;
}

export interface UseComboMarketsResult {
  day: ComboMarketsDay;
  setDay: (day: ComboMarketsDay) => void;
  groups: ComboGameGroup[];
  markets: ComboMarketRecord[];
  nextCursor?: string | null;
  loading: boolean;
  error: string | undefined;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useComboMarkets(
  options: UseComboMarketsOptions = {},
): UseComboMarketsResult {
  const { limit = 50, enabled = true } = options;
  const hydrated = useComboMarketsHydrated();
  const day = useComboMarketsDay();
  const groups = useComboMarketsGroups();
  const markets = useComboMarketsList();
  const nextCursor = useComboMarketsNextCursor();
  const status = useComboMarketsStatus();
  const error = useComboMarketsError();
  const setDayInStore = useComboMarketsStore((state) => state.setDay);
  const fetchMarkets = useComboMarketsStore((state) => state.fetchMarkets);
  const refreshIfStale = useComboMarketsStore((state) => state.refreshIfStale);
  const loadMoreMarkets = useComboMarketsStore((state) => state.loadMore);
  const abort = useComboMarketsStore((state) => state.abort);

  const setDay = useCallback(
    (nextDay: ComboMarketsDay) => {
      if (nextDay === day) {
        return;
      }

      setDayInStore(nextDay);

      const timezone = resolveComboMarketsTimezone();
      const snapshot = useComboMarketsStore.getState().snapshots[nextDay];
      const silent = hasFreshComboMarketsSnapshot(snapshot, timezone);

      void fetchMarkets({ day: nextDay, limit, silent });
    },
    [day, fetchMarkets, limit, setDayInStore],
  );

  useEffect(() => {
    if (!enabled) {
      abort();
      useComboMarketsStore.setState({
        day: "today",
        snapshots: {},
        groups: [],
        markets: [],
        nextCursor: undefined,
        status: "idle",
        error: undefined,
      });
      return;
    }

    if (!hydrated) {
      return;
    }

    const timezone = resolveComboMarketsTimezone();
    const snapshot = useComboMarketsStore.getState().snapshots[day];
    const silent = hasFreshComboMarketsSnapshot(snapshot, timezone);

    void fetchMarkets({ day, limit, silent });

    return () => {
      abort();
    };
  }, [abort, day, enabled, fetchMarkets, hydrated, limit]);

  useEffect(() => {
    if (!enabled || !hydrated) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshIfStale({ limit });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, hydrated, limit, refreshIfStale]);

  useEffect(() => {
    if (!enabled || !hydrated) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleMidnightRefresh = () => {
      if (timer) {
        clearTimeout(timer);
      }

      const delay = getMsUntilNextCalendarDay(resolveComboMarketsTimezone());
      timer = setTimeout(() => {
        void refreshIfStale({ limit });
        scheduleMidnightRefresh();
      }, delay);
    };

    scheduleMidnightRefresh();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [enabled, hydrated, limit, refreshIfStale]);

  const reload = useCallback(async () => {
    const timezone = resolveComboMarketsTimezone();
    const snapshot = useComboMarketsStore.getState().snapshots[day];
    const silent = hasFreshComboMarketsSnapshot(snapshot, timezone);

    await fetchMarkets({ day, limit, silent });
  }, [day, fetchMarkets, limit]);

  const loadMore = useCallback(async () => {
    await loadMoreMarkets(limit);
  }, [limit, loadMoreMarkets]);

  const loading =
    enabled &&
    (!hydrated || (status === "loading" && groups.length === 0));

  return {
    day: enabled ? day : "today",
    setDay,
    groups: enabled ? groups : [],
    markets: enabled ? markets : [],
    nextCursor: enabled ? nextCursor : undefined,
    loading,
    error: enabled ? error : undefined,
    loadMore,
    reload,
  };
}
