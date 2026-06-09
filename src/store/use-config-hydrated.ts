"use client";

import { useSyncExternalStore } from "react";

import { useUserConfigStore } from "@/store/user-config-store";

function subscribeHydration(onStoreChange: () => void) {
  return useUserConfigStore.persist.onFinishHydration(onStoreChange);
}

function getHydrationSnapshot() {
  return useUserConfigStore.persist.hasHydrated();
}

function getHydrationServerSnapshot() {
  return false;
}

export function useConfigHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot
  );
}
