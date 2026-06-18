"use client";

import { useSyncExternalStore } from "react";

import { useComboMarketsStore } from "@/store/combo-markets-store";

function subscribeHydration(onStoreChange: () => void) {
  return useComboMarketsStore.persist.onFinishHydration(onStoreChange);
}

function getHydrationSnapshot() {
  return useComboMarketsStore.persist.hasHydrated();
}

function getHydrationServerSnapshot() {
  return false;
}

export function useComboMarketsHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );
}
