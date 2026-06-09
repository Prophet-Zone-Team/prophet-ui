"use client";

import { useSyncExternalStore } from "react";

import { useAuthStore } from "@/store/auth-store";

function subscribeHydration(onStoreChange: () => void) {
  return useAuthStore.persist.onFinishHydration(onStoreChange);
}

function getHydrationSnapshot() {
  return useAuthStore.persist.hasHydrated();
}

function getHydrationServerSnapshot() {
  return false;
}

export function useAuthHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );
}
