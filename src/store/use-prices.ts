"use client";

import { create } from "zustand";

import type { TokenPricesBySymbol } from "@/types/funding";

interface PricesStore {
  prices: TokenPricesBySymbol;
  loading: boolean;
  updatedAt?: string;
  error?: string;
  setPrices: (payload: {
    prices: TokenPricesBySymbol;
    updatedAt?: string;
    error?: string;
  }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  clearPrices: () => void;
}

const initialState = {
  prices: {} as TokenPricesBySymbol,
  loading: false,
  updatedAt: undefined,
  error: undefined,
};

export const usePricesStore = create<PricesStore>((set) => ({
  ...initialState,
  setPrices: ({ prices, updatedAt, error }) =>
    set({
      prices,
      updatedAt: updatedAt ?? new Date().toISOString(),
      error,
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearPrices: () => set({ ...initialState }),
}));
