"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const MIN_FAST_BID_AMOUNT = 5;
export const DEFAULT_FAST_BID_AMOUNT = 10;
export const FAST_BID_PRESET_AMOUNTS = [5, 10, 100, 1000] as const;

interface UserConfigState {
  fastBidAmount: number;
  setFastBidAmount: (amount: number) => void;
}

export function normalizeFastBidAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return DEFAULT_FAST_BID_AMOUNT;
  }

  return Math.min(10_000, Math.max(MIN_FAST_BID_AMOUNT, amount));
}

export function formatFastBidAmountDisplay(amount: number): string {
  const normalized = normalizeFastBidAmount(amount);

  if (Number.isInteger(normalized)) {
    return `$${normalized}`;
  }

  return `$${normalized.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;
}

export const useUserConfigStore = create<UserConfigState>()(
  persist(
    (set) => ({
      fastBidAmount: DEFAULT_FAST_BID_AMOUNT,
      setFastBidAmount: (amount) => {
        set({ fastBidAmount: normalizeFastBidAmount(amount) });
      }
    }),
    {
      name: "wc-user-config",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        fastBidAmount: state.fastBidAmount
      }),
      migrate: (persisted) => {
        const state = persisted as { fastBidAmount?: number } | undefined;

        return {
          fastBidAmount: normalizeFastBidAmount(
            state?.fastBidAmount ?? DEFAULT_FAST_BID_AMOUNT
          )
        };
      }
    }
  )
);

export function useFastBidAmount() {
  return useUserConfigStore((state) => state.fastBidAmount);
}

export function useSetFastBidAmount() {
  return useUserConfigStore((state) => state.setFastBidAmount);
}
