"use client";

import { useSyncExternalStore } from "react";

import { useComboStore } from "@/store/combo-store";

function subscribeHydration(onStoreChange: () => void) {
  return useComboStore.persist.onFinishHydration(onStoreChange);
}

function getHydrationSnapshot() {
  return useComboStore.persist.hasHydrated();
}

function getHydrationServerSnapshot() {
  return false;
}

export function useComboHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );
}
