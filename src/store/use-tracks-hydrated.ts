"use client";

import { useSyncExternalStore } from "react";

import { useTracksStore } from "@/store/tracks-store";

function subscribeHydration(onStoreChange: () => void) {
  return useTracksStore.persist.onFinishHydration(onStoreChange);
}

function getHydrationSnapshot() {
  return useTracksStore.persist.hasHydrated();
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
