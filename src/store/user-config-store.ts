"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const MIN_FAST_BID_AMOUNT = 5;
export const DEFAULT_FAST_BID_AMOUNT = 10;
export const FAST_BID_PRESET_AMOUNTS = [5, 10, 100, 1000] as const;

interface UserConfigState {
  fastBidAmount: number;
  showOrderbook: boolean;
  setFastBidAmount: (amount: number) => void;
  setShowOrderbook: (value: boolean) => void;
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
      showOrderbook: true,
      setFastBidAmount: (amount) => {
        set({ fastBidAmount: normalizeFastBidAmount(amount) });
      },
      setShowOrderbook: (value) => {
        set({ showOrderbook: value });
      }
    }),
    {
      name: "wc-user-config",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        fastBidAmount: state.fastBidAmount,
        showOrderbook: state.showOrderbook
      }),
      migrate: (persisted) => {
        const state = persisted as
          | { fastBidAmount?: number; showOrderbook?: boolean }
          | undefined;

        return {
          fastBidAmount: normalizeFastBidAmount(
            state?.fastBidAmount ?? DEFAULT_FAST_BID_AMOUNT
          ),
          showOrderbook: state?.showOrderbook ?? true
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

export function useShowOrderbook() {
  return useUserConfigStore((state) => state.showOrderbook);
}

export function useSetShowOrderbook() {
  return useUserConfigStore((state) => state.setShowOrderbook);
}
