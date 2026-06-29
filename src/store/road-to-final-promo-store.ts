"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RoadToFinalPromoState {
  dismissed: boolean;
  dismiss: () => void;
}

export const useRoadToFinalPromoStore = create<RoadToFinalPromoState>()(
  persist(
    (set) => ({
      dismissed: false,
      dismiss: () => {
        set({ dismissed: true });
      },
    }),
    {
      name: "prophet-road-to-final-promo",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        dismissed: state.dismissed,
      }),
    },
  ),
);

function subscribeHydration(onStoreChange: () => void) {
  return useRoadToFinalPromoStore.persist.onFinishHydration(onStoreChange);
}

function getHydrationSnapshot() {
  return useRoadToFinalPromoStore.persist.hasHydrated();
}

function getHydrationServerSnapshot() {
  return false;
}

export function useRoadToFinalPromoHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );
}
