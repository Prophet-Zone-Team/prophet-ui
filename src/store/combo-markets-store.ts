"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  getCalendarDateInTimezone,
  hasFreshComboMarketsSnapshot,
  isComboMarketsSnapshotStale,
  resolveComboMarketsTimezone,
} from "@/lib/combo/combo-markets-cache";
import { fetchComboMarkets } from "@/lib/combo/markets-client";
import type {
  ComboGameGroup,
  ComboMarketRecord,
  ComboMarketsDay,
  ComboMarketsDaySnapshot,
} from "@/types/combo";

export type ComboMarketsStatus = "idle" | "loading" | "ready" | "error";

interface FetchComboMarketsOptions {
  day?: ComboMarketsDay;
  limit?: number;
  silent?: boolean;
  cursor?: string;
  append?: boolean;
  timezone?: string;
}

interface ComboMarketsStoreState {
  day: ComboMarketsDay;
  snapshots: Partial<Record<ComboMarketsDay, ComboMarketsDaySnapshot>>;
  groups: ComboGameGroup[];
  markets: ComboMarketRecord[];
  nextCursor?: string | null;
  status: ComboMarketsStatus;
  error?: string;
  setDay: (day: ComboMarketsDay) => void;
  fetchMarkets: (options?: FetchComboMarketsOptions) => Promise<void>;
  refreshIfStale: (options?: { limit?: number; timezone?: string }) => Promise<void>;
  loadMore: (limit?: number) => Promise<void>;
  abort: () => void;
}

const initialState = {
  day: "today" as ComboMarketsDay,
  snapshots: {} as Partial<Record<ComboMarketsDay, ComboMarketsDaySnapshot>>,
  groups: [] as ComboGameGroup[],
  markets: [] as ComboMarketRecord[],
  nextCursor: undefined as string | null | undefined,
  status: "idle" as ComboMarketsStatus,
  error: undefined as string | undefined,
};

let abortController: AbortController | undefined;
let loadMoreInFlight = false;

export const useComboMarketsStore = create<ComboMarketsStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDay: (day) => {
        const timezone = resolveComboMarketsTimezone();
        const snapshot = get().snapshots[day];
        const view = snapshotToView(snapshot);

        set({
          day,
          groups: view.groups,
          markets: view.markets,
          nextCursor: view.nextCursor,
          error: undefined,
        });
      },

      fetchMarkets: async (options = {}) => {
        const day = options.day ?? get().day;
        const limit = options.limit ?? 50;
        const timezone = resolveComboMarketsTimezone(options.timezone);
        const snapshot = get().snapshots[day];
        const freshSnapshot = hasFreshComboMarketsSnapshot(snapshot, timezone);
        const silent = options.silent ?? freshSnapshot;
        const append = options.append ?? false;
        const showLoading = !silent && !append && !freshSnapshot;

        if (!append) {
          abortController?.abort();
          abortController = new AbortController();
        }

        const controller = append ? new AbortController() : abortController;

        if (!controller) {
          return;
        }

        if (showLoading) {
          set({ status: "loading", error: undefined });
        }

        try {
          const response = await fetchComboMarkets({
            day,
            limit,
            cursor: options.cursor,
            timezone,
            signal: controller.signal,
          });

          if (controller.signal.aborted) {
            return;
          }

          const nextSnapshot: ComboMarketsDaySnapshot = append
            ? mergeDaySnapshot(snapshot, response, timezone)
            : createDaySnapshot(response, timezone);

          set((state) => {
            const snapshots = {
              ...state.snapshots,
              [day]: nextSnapshot,
            };
            const isActiveDay = state.day === day;
            const view = isActiveDay
              ? snapshotToView(nextSnapshot)
              : snapshotToView(state.snapshots[state.day]);

            return {
              snapshots,
              groups: view.groups,
              markets: view.markets,
              nextCursor: view.nextCursor,
              status: "ready",
              error: undefined,
            };
          });
        } catch (fetchError) {
          if (controller.signal.aborted || isAbortError(fetchError)) {
            return;
          }

          const message =
            fetchError instanceof Error ? fetchError.message : String(fetchError);

          if (!freshSnapshot && !append) {
            set({
              status: "error",
              error: message,
              groups: [],
              markets: [],
              nextCursor: undefined,
            });
            return;
          }

          if (!silent) {
            set({ error: message });
          }
        }
      },

      refreshIfStale: async (options = {}) => {
        const day = get().day;
        const timezone = resolveComboMarketsTimezone(options.timezone);
        const snapshot = get().snapshots[day];

        if (!isComboMarketsSnapshotStale(snapshot, timezone)) {
          return;
        }

        await get().fetchMarkets({
          day,
          limit: options.limit,
          timezone,
          silent: hasFreshComboMarketsSnapshot(snapshot, timezone),
        });
      },

      loadMore: async (limit = 50) => {
        const day = get().day;
        const nextCursor = get().snapshots[day]?.nextCursor ?? get().nextCursor;

        if (!nextCursor || loadMoreInFlight) {
          return;
        }

        loadMoreInFlight = true;

        try {
          await get().fetchMarkets({
            day,
            limit,
            cursor: nextCursor,
            append: true,
            silent: true,
          });
        } finally {
          loadMoreInFlight = false;
        }
      },

      abort: () => {
        abortController?.abort();
        abortController = undefined;
      },
    }),
    {
      name: "wc-combo-markets",
      version: 3,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        day: state.day,
        snapshots: state.snapshots,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<ComboMarketsStoreState> | undefined;
        const snapshots = sanitizeSnapshots(persistedState?.snapshots);
        const day =
          persistedState?.day === "all" ||
          persistedState?.day === "today" ||
          persistedState?.day === "tomorrow"
            ? persistedState.day
            : current.day;
        const view = snapshotToView(snapshots[day]);

        return {
          ...current,
          day,
          snapshots,
          groups: view.groups,
          markets: view.markets,
          nextCursor: view.nextCursor,
        };
      },
    },
  ),
);

export function useComboMarketsDay() {
  return useComboMarketsStore((state) => state.day);
}

export function useComboMarketsGroups() {
  return useComboMarketsStore((state) => state.groups);
}

export function useComboMarketsList() {
  return useComboMarketsStore((state) => state.markets);
}

export function useComboMarketsNextCursor() {
  return useComboMarketsStore((state) => state.nextCursor);
}

export function useComboMarketsStatus() {
  return useComboMarketsStore((state) => state.status);
}

export function useComboMarketsError() {
  return useComboMarketsStore((state) => state.error);
}

export function selectFreshComboMarketsSnapshot(
  day: ComboMarketsDay,
  timezone = resolveComboMarketsTimezone(),
): ComboMarketsDaySnapshot | undefined {
  const snapshot = useComboMarketsStore.getState().snapshots[day];

  return hasFreshComboMarketsSnapshot(snapshot, timezone) ? snapshot : undefined;
}

function createDaySnapshot(
  response: {
    groups: ComboGameGroup[];
    markets: ComboMarketRecord[];
    nextCursor?: string | null;
  },
  timezone: string,
): ComboMarketsDaySnapshot {
  return {
    groups: response.groups,
    markets: response.markets,
    nextCursor: response.nextCursor ?? null,
    cachedOnDate: getCalendarDateInTimezone(timezone),
    timezone,
  };
}

function mergeDaySnapshot(
  current: ComboMarketsDaySnapshot | undefined,
  response: {
    groups: ComboGameGroup[];
    markets: ComboMarketRecord[];
    nextCursor?: string | null;
  },
  timezone: string,
): ComboMarketsDaySnapshot {
  const groups = mergeComboGroups(current?.groups ?? [], response.groups);
  const markets = mergeComboMarkets(current?.markets ?? [], response.markets);

  return {
    groups,
    markets,
    nextCursor: response.nextCursor ?? null,
    cachedOnDate: getCalendarDateInTimezone(timezone),
    timezone,
  };
}

function snapshotToView(snapshot: ComboMarketsDaySnapshot | undefined) {
  return {
    groups: snapshot?.groups ?? [],
    markets: snapshot?.markets ?? [],
    nextCursor: snapshot?.nextCursor,
  };
}

function mergeComboGroups(
  current: ComboGameGroup[],
  incoming: ComboGameGroup[],
): ComboGameGroup[] {
  const bySlug = new Map(current.map((group) => [group.slug, group]));

  for (const group of incoming) {
    bySlug.set(group.slug, group);
  }

  return [...bySlug.values()];
}

function mergeComboMarkets(
  current: ComboMarketRecord[],
  incoming: ComboMarketRecord[],
): ComboMarketRecord[] {
  const byId = new Map(current.map((market) => [market.id, market]));

  for (const market of incoming) {
    byId.set(market.id, market);
  }

  return [...byId.values()];
}

function sanitizeSnapshots(
  value: unknown,
): Partial<Record<ComboMarketsDay, ComboMarketsDaySnapshot>> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const raw = value as Partial<Record<ComboMarketsDay, unknown>>;
  const snapshots: Partial<Record<ComboMarketsDay, ComboMarketsDaySnapshot>> = {};

  for (const day of ["all", "today", "tomorrow"] as const) {
    const snapshot = sanitizeSnapshot(raw[day]);

    if (snapshot) {
      snapshots[day] = snapshot;
    }
  }

  return snapshots;
}

function sanitizeSnapshot(value: unknown): ComboMarketsDaySnapshot | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const snapshot = value as Partial<ComboMarketsDaySnapshot>;
  const groups = sanitizeComboGroups(snapshot.groups);
  const markets = sanitizeComboMarkets(snapshot.markets);

  if (groups.length === 0) {
    return undefined;
  }

  return {
    groups,
    markets: markets.length > 0 ? markets : groups.flatMap((group) => group.markets),
    nextCursor:
      snapshot.nextCursor === null || typeof snapshot.nextCursor === "string"
        ? snapshot.nextCursor
        : undefined,
    cachedOnDate:
      typeof snapshot.cachedOnDate === "string" ? snapshot.cachedOnDate : "",
    timezone: typeof snapshot.timezone === "string" ? snapshot.timezone : "",
  };
}

function sanitizeComboGroups(value: unknown): ComboGameGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(sanitizeComboGroup)
    .filter((group): group is ComboGameGroup => Boolean(group));
}

function sanitizeComboGroup(value: unknown): ComboGameGroup | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const group = value as Partial<ComboGameGroup>;
  const markets = sanitizeComboMarkets(group.markets);

  if (
    typeof group.slug !== "string" ||
    typeof group.title !== "string" ||
    typeof group.kickoffLabel !== "string" ||
    !group.homeTeam ||
    !group.awayTeam ||
    typeof group.homeTeam.name !== "string" ||
    typeof group.homeTeam.code !== "string" ||
    typeof group.awayTeam.name !== "string" ||
    typeof group.awayTeam.code !== "string" ||
    markets.length === 0
  ) {
    return undefined;
  }

  return {
    slug: group.slug,
    title: group.title,
    kickoffAt: typeof group.kickoffAt === "string" ? group.kickoffAt : undefined,
    kickoffLabel: group.kickoffLabel,
    image: typeof group.image === "string" ? group.image : undefined,
    homeTeam: {
      name: group.homeTeam.name,
      code: group.homeTeam.code,
      logoUrl:
        typeof group.homeTeam.logoUrl === "string"
          ? group.homeTeam.logoUrl
          : undefined,
    },
    awayTeam: {
      name: group.awayTeam.name,
      code: group.awayTeam.code,
      logoUrl:
        typeof group.awayTeam.logoUrl === "string"
          ? group.awayTeam.logoUrl
          : undefined,
    },
    markets,
    status:
      typeof group.status === "string" && group.status.length > 0
        ? group.status
        : "scheduled",
    eventId: typeof group.eventId === "string" ? group.eventId : undefined,
    homeScore:
      typeof group.homeScore === "number" ? group.homeScore : undefined,
    awayScore:
      typeof group.awayScore === "number" ? group.awayScore : undefined,
  };
}

function sanitizeComboMarkets(value: unknown): ComboMarketRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(sanitizeComboMarket)
    .filter((market): market is ComboMarketRecord => Boolean(market));
}

function sanitizeComboMarket(value: unknown): ComboMarketRecord | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const market = value as Partial<ComboMarketRecord>;

  if (
    typeof market.id !== "string" ||
    typeof market.conditionId !== "string" ||
    !Array.isArray(market.positionIds) ||
    market.positionIds.length !== 2 ||
    typeof market.positionIds[0] !== "string" ||
    typeof market.positionIds[1] !== "string" ||
    typeof market.slug !== "string" ||
    typeof market.title !== "string" ||
    !Array.isArray(market.outcomes) ||
    market.outcomes.length !== 2 ||
    typeof market.outcomes[0] !== "string" ||
    typeof market.outcomes[1] !== "string" ||
    !Array.isArray(market.outcomePrices) ||
    market.outcomePrices.length !== 2 ||
    typeof market.outcomePrices[0] !== "string" ||
    typeof market.outcomePrices[1] !== "string"
  ) {
    return undefined;
  }

  return {
    id: market.id,
    conditionId: market.conditionId,
    positionIds: [market.positionIds[0], market.positionIds[1]],
    slug: market.slug,
    title: market.title,
    outcomes: [market.outcomes[0], market.outcomes[1]],
    outcomePrices: [market.outcomePrices[0], market.outcomePrices[1]],
    image: typeof market.image === "string" ? market.image : undefined,
    volume: typeof market.volume === "number" ? market.volume : undefined,
    tags: Array.isArray(market.tags)
      ? market.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
  };
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
