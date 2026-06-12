"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";

interface MigratePromptState {
  autoPromptedWallets: Record<string, true>;
  hasAutoPrompted: (walletAddress: string) => boolean;
  markAutoPrompted: (walletAddress: string) => void;
  resetAutoPrompted: () => void;
}

function normalizeWalletKey(walletAddress: string) {
  return walletAddress.trim().toLowerCase();
}

export const useMigratePromptStore = create<MigratePromptState>()(
  persist(
    (set, get) => ({
      autoPromptedWallets: {},
      hasAutoPrompted: (walletAddress) => {
        const key = normalizeWalletKey(walletAddress);
        return Boolean(get().autoPromptedWallets[key]);
      },
      markAutoPrompted: (walletAddress) => {
        const key = normalizeWalletKey(walletAddress);
        set((state) => ({
          autoPromptedWallets: {
            ...state.autoPromptedWallets,
            [key]: true,
          },
        }));
      },
      resetAutoPrompted: () => {
        set(() => {
          return { autoPromptedWallets: {} };
        });
      },
    }),
    {
      name: "prophet-migrate-prompt",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        autoPromptedWallets: state.autoPromptedWallets,
      }),
    },
  ),
);

function subscribeHydration(onStoreChange: () => void) {
  return useMigratePromptStore.persist.onFinishHydration(onStoreChange);
}

function getHydrationSnapshot() {
  return useMigratePromptStore.persist.hasHydrated();
}

function getHydrationServerSnapshot() {
  return false;
}

export function useMigratePromptHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );
}
