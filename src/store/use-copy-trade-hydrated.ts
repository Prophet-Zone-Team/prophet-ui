"use client";

import { useSyncExternalStore } from "react";

import { useCopyTradeStore } from "@/store/copy-trade-store";

function subscribeHydration(onStoreChange: () => void) {
  return useCopyTradeStore.persist.onFinishHydration(onStoreChange);
}

function getHydrationSnapshot() {
  return useCopyTradeStore.persist.hasHydrated();
}

function getHydrationServerSnapshot() {
  return false;
}

export function useCopyTradeHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );
}
