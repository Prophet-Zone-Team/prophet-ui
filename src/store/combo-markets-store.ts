"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { fetchComboMarkets } from "@/lib/combo/markets-client";
import type { ComboMarketRecord } from "@/types/combo";

export type ComboMarketsStatus = "idle" | "loading" | "ready" | "error";

interface FetchComboMarketsOptions {
  limit?: number;
  silent?: boolean;
  cursor?: string;
  append?: boolean;
}

interface ComboMarketsStoreState {
  markets: ComboMarketRecord[];
  nextCursor?: string | null;
  status: ComboMarketsStatus;
  error?: string;
  fetchMarkets: (options?: FetchComboMarketsOptions) => Promise<void>;
  loadMore: (limit?: number) => Promise<void>;
  abort: () => void;
}

const initialState = {
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

      fetchMarkets: async (options = {}) => {
        const { limit = 50, silent = false, cursor, append = false } = options;
        const hasCache = get().markets.length > 0;
        const showLoading = !silent && !append && !hasCache;

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
            limit,
            cursor,
            signal: controller.signal,
          });

          if (controller.signal.aborted) {
            return;
          }

          set((state) => ({
            markets: append
              ? [...state.markets, ...response.markets]
              : response.markets,
            nextCursor: response.nextCursor ?? null,
            status: "ready",
            error: undefined,
          }));
        } catch (fetchError) {
          if (controller.signal.aborted || isAbortError(fetchError)) {
            return;
          }

          const message =
            fetchError instanceof Error ? fetchError.message : String(fetchError);

          if (!hasCache && !append) {
            set({
              status: "error",
              error: message,
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

      loadMore: async (limit = 50) => {
        const nextCursor = get().nextCursor;

        if (!nextCursor || loadMoreInFlight) {
          return;
        }

        loadMoreInFlight = true;

        try {
          await get().fetchMarkets({
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
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        markets: state.markets,
        nextCursor: state.nextCursor,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<ComboMarketsStoreState> | undefined;

        return {
          ...current,
          markets: sanitizeComboMarkets(persistedState?.markets),
          nextCursor:
            persistedState?.nextCursor === null ||
            typeof persistedState?.nextCursor === "string"
              ? persistedState.nextCursor
              : undefined,
        };
      },
    },
  ),
);

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
