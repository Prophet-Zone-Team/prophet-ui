"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  buildTrackRequest,
  buildUntrackRequest,
  type ProphetBookmarkTarget
} from "@/lib/tracks/track-status";
import {
  buildTrackStatusMapFromApiItems,
  resolveTrackStoreKeyFromTarget,
  trackItemMatchesBookmarkTarget
} from "@/lib/tracks/track-status-keys";
import {
  getProphetTrackList,
  getProphetTracks,
  isProphetAuthenticated,
  ProphetApiError,
  syncProphetWalletLogin,
  trackProphet,
  untrackProphet
} from "@/service/prophet";
import { useAuthStore } from "@/store/auth-store";
import type { ProphetUserTrackItem } from "@/types/prophet-api";

export type TracksLoadStatus = "idle" | "loading" | "ready" | "error";

const initialState = {
  items: [] as ProphetUserTrackItem[],
  byKey: {} as Record<string, boolean>,
  status: "idle" as TracksLoadStatus,
  error: undefined as string | undefined,
  accountWallet: undefined as string | undefined,
  pendingKeys: {} as Record<string, boolean>
};

interface TracksStore {
  items: ProphetUserTrackItem[];
  byKey: Record<string, boolean>;
  status: TracksLoadStatus;
  error?: string;
  accountWallet?: string;
  pendingKeys: Record<string, boolean>;
  reset: () => void;
  initializeForAccount: (walletAddress: string | undefined) => Promise<void>;
  fetchTracks: () => Promise<void>;
  syncBookmarkStatus: () => Promise<void>;
  trackTarget: (target: ProphetBookmarkTarget) => Promise<void>;
  untrackTarget: (target: ProphetBookmarkTarget) => Promise<void>;
}

function applyByKeyUpdate(
  byKey: Record<string, boolean>,
  key: string,
  tracked: boolean
): Record<string, boolean> {
  if (tracked) {
    if (byKey[key] === true) {
      return byKey;
    }

    return { ...byKey, [key]: true };
  }

  if (!(key in byKey)) {
    return byKey;
  }

  const next = { ...byKey };
  delete next[key];

  return next;
}

export const useTracksStore = create<TracksStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      reset: () => {
        set({ ...initialState });
      },

      initializeForAccount: async (walletAddress) => {
        if (!walletAddress) {
          get().reset();
          return;
        }

        const prevWallet = get().accountWallet;

        if (walletAddress === prevWallet) {
          return;
        }

        if (prevWallet !== undefined) {
          get().reset();
        }

        set({ accountWallet: walletAddress });

        try {
          await syncProphetWalletLogin(walletAddress);

          if (!isProphetAuthenticated()) {
            return;
          }

          await get().syncBookmarkStatus();
        } catch (error) {
          console.warn("[tracks-store] initialize failed", error);
        }
      },

      fetchTracks: async () => {
        const walletAddress = get().accountWallet;

        if (!walletAddress) {
          return;
        }

        set({ status: "loading", error: undefined });

        try {
          if (!isProphetAuthenticated()) {
            set({ items: [], byKey: {}, status: "ready", error: undefined });
            return;
          }

          const items = await getProphetTracks();

          set({
            items: items ?? [],
            byKey: buildTrackStatusMapFromApiItems(items ?? []),
            status: "ready",
            error: undefined
          });
        } catch (error) {
          console.warn("[tracks] failed to load user tracks", error);

          set({
            items: [],
            byKey: {},
            status: "error",
            error:
              error instanceof ProphetApiError
                ? error.message
                : error instanceof Error
                  ? error.message
                  : "Unable to load tracks."
          });
        }
      },

      syncBookmarkStatus: async () => {
        if (!isProphetAuthenticated()) {
          return;
        }

        try {
          const items = await getProphetTrackList();
          set({ byKey: buildTrackStatusMapFromApiItems(items ?? []) });
        } catch (error) {
          console.warn("[tracks-store] failed to sync bookmark status", error);
        }
      },

      trackTarget: async (target) => {
        const key = resolveTrackStoreKeyFromTarget(target);
        const previousByKey = get().byKey;

        set((state) => ({
          byKey: applyByKeyUpdate(state.byKey, key, true),
          pendingKeys: { ...state.pendingKeys, [key]: true }
        }));

        try {
          await trackProphet(buildTrackRequest(target));
        } catch (error) {
          set({ byKey: previousByKey });
          throw error;
        } finally {
          set((state) => {
            if (!(key in state.pendingKeys)) {
              return state;
            }

            const nextPending = { ...state.pendingKeys };
            delete nextPending[key];

            return { pendingKeys: nextPending };
          });
        }
      },

      untrackTarget: async (target) => {
        const key = resolveTrackStoreKeyFromTarget(target);
        const previousByKey = get().byKey;
        const previousItems = get().items;

        set((state) => ({
          byKey: applyByKeyUpdate(state.byKey, key, false),
          items: state.items.filter(
            (item) => !trackItemMatchesBookmarkTarget(item, target)
          ),
          pendingKeys: { ...state.pendingKeys, [key]: true }
        }));

        try {
          await untrackProphet(buildUntrackRequest(target));
        } catch (error) {
          set({ byKey: previousByKey, items: previousItems });
          throw error;
        } finally {
          set((state) => {
            if (!(key in state.pendingKeys)) {
              return state;
            }

            const nextPending = { ...state.pendingKeys };
            delete nextPending[key];

            return { pendingKeys: nextPending };
          });
        }
      }
    }),
    {
      name: "wc-tracks",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        items: state.items,
        byKey: state.byKey
      })
    }
  )
);

export function useTracksItems(): ProphetUserTrackItem[] {
  return useTracksStore((state) => state.items);
}

export function useIsTrackTracked(key: string): boolean {
  return useTracksStore((state) => state.byKey[key] === true);
}

export function useTrackPending(key: string): boolean {
  return useTracksStore((state) => state.pendingKeys[key] === true);
}

function bindTracksStoreToAuth(): void {
  if (typeof window === "undefined") {
    return;
  }

  const runInitialize = () => {
    void useTracksStore
      .getState()
      .initializeForAccount(useAuthStore.getState().session?.walletAddress);
  };

  useAuthStore.persist.onFinishHydration(runInitialize);

  if (useAuthStore.persist.hasHydrated()) {
    runInitialize();
  }

  useAuthStore.subscribe((state, prevState) => {
    if (!useAuthStore.persist.hasHydrated()) {
      return;
    }

    const wallet = state.session?.walletAddress;
    const prevWallet = prevState.session?.walletAddress;

    if (wallet === prevWallet) {
      return;
    }

    void useTracksStore.getState().initializeForAccount(wallet);
  });
}

bindTracksStoreToAuth();
