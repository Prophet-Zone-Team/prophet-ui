"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

import type {
  CopyTradeStoredSession,
  CopyTradeUser,
  CopyWallet,
} from "@/types/copy-trade-api";

const LEGACY_STORAGE_KEY = "copy_trade_session";
const LEGACY_STORAGE_KEY_PREFIX = "copy_trade_";

interface CopyTradePersistedState {
  walletAddress: string | null;
  user: CopyTradeUser | null;
  copyWallet: CopyWallet | null;
  expiresAt: number | null;
}

interface CopyTradeStore extends CopyTradePersistedState {
  setSession: (session: CopyTradeStoredSession) => void;
  updateCopyWallet: (copyWallet: CopyWallet | null) => void;
  clearSession: () => void;
}

const initialPersistedState: CopyTradePersistedState = {
  walletAddress: null,
  user: null,
  copyWallet: null,
  expiresAt: null,
};

function isValidStoredSession(
  value: Partial<CopyTradeStoredSession> | null | undefined,
): value is CopyTradeStoredSession {
  return Boolean(value?.walletAddress && value.user?.ID);
}

function readLegacySession(): CopyTradeStoredSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CopyTradeStoredSession>;
    if (!isValidStoredSession(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function removeLegacyStorageKeys(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const keysToRemove: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(LEGACY_STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage failures.
  }
}

export const useCopyTradeStore = create<CopyTradeStore>()(
  persist(
    (set) => ({
      ...initialPersistedState,
      setSession: (session) =>
        set({
          walletAddress: session.walletAddress,
          user: session.user,
          copyWallet: session.copyWallet ?? null,
          expiresAt: session.expiresAt ?? null,
        }),
      updateCopyWallet: (copyWallet) => set({ copyWallet }),
      clearSession: () =>
        set((state) => {
          if (
            !state.walletAddress &&
            !state.user &&
            !state.copyWallet &&
            !state.expiresAt
          ) {
            return state;
          }

          return { ...initialPersistedState };
        }),
    }),
    {
      name: "prophet-copy-trade",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        user: state.user,
        copyWallet: state.copyWallet,
        expiresAt: state.expiresAt,
      }),
      migrate: (persisted, version) => {
        const state = persisted as Partial<CopyTradePersistedState> | undefined;

        if (state?.walletAddress && state.user?.ID) {
          return {
            walletAddress: state.walletAddress,
            user: state.user,
            copyWallet: state.copyWallet ?? null,
            expiresAt: state.expiresAt ?? null,
          };
        }

        if (version < 2) {
          const legacy = readLegacySession();
          if (legacy) {
            removeLegacyStorageKeys();
            return {
              walletAddress: legacy.walletAddress,
              user: legacy.user,
              copyWallet: legacy.copyWallet ?? null,
              expiresAt: legacy.expiresAt ?? null,
            };
          }
        }

        return initialPersistedState;
      },
    },
  ),
);

export function useCopyTradeStoredSession(): CopyTradeStoredSession | null {
  return useCopyTradeStore(useShallow(selectCopyTradeSession));
}

export function selectCopyTradeSession(
  state: CopyTradeStore,
): CopyTradeStoredSession | null {
  if (
    !isValidStoredSession({
      walletAddress: state.walletAddress ?? undefined,
      user: state.user ?? undefined,
      copyWallet: state.copyWallet ?? undefined,
      expiresAt: state.expiresAt ?? undefined,
    })
  ) {
    return null;
  }

  return {
    walletAddress: state.walletAddress!,
    user: state.user!,
    copyWallet: state.copyWallet,
    expiresAt: state.expiresAt ?? undefined,
  };
}

export function selectCopyTradeUserId(state: CopyTradeStore): number | undefined {
  return state.user?.ID;
}

export function isCopyTradeSessionExpired(expiresAt?: number | null): boolean {
  if (!expiresAt) {
    return false;
  }

  return expiresAt <= Math.floor(Date.now() / 1000);
}
