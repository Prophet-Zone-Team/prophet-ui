"use client";

import { useSyncExternalStore } from "react";

import { useTrackedItemsStore } from "./tracked-items-store";

function subscribeHydration(onStoreChange: () => void) {
  return useTrackedItemsStore.persist.onFinishHydration(onStoreChange);
}

function getHydrationSnapshot() {
  return useTrackedItemsStore.persist.hasHydrated();
}

function getHydrationServerSnapshot() {
  return false;
}

export function useTracksHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot
  );
}
