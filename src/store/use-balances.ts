"use client";

import { create } from "zustand";

import { normalizeTokenAddress } from "@/lib/funding/evm-balances";
import type { EvmBalancesByChain } from "@/types/funding";

interface BalancesStore {
  evmBalances: EvmBalancesByChain;
  loading: boolean;
  updatedAt?: string;
  error?: string;
  setEvmBalances: (payload: {
    evmBalances: EvmBalancesByChain;
    updatedAt?: string;
    error?: string;
  }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  patchEvmTokenBalance: (payload: {
    chainId: number;
    address: string;
    balance: string;
  }) => void;
  clearEvmBalances: () => void;
}

const initialState = {
  evmBalances: {} as EvmBalancesByChain,
  loading: false,
  updatedAt: undefined,
  error: undefined,
};

export const useBalancesStore = create<BalancesStore>((set) => ({
  ...initialState,
  setEvmBalances: ({ evmBalances, updatedAt, error }) =>
    set({
      evmBalances,
      updatedAt: updatedAt ?? new Date().toISOString(),
      error,
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  patchEvmTokenBalance: ({ chainId, address, balance }) =>
    set((state) => {
      const chainKey = String(chainId);
      const tokenKey = normalizeTokenAddress(address);

      return {
        evmBalances: {
          ...state.evmBalances,
          [chainKey]: {
            ...state.evmBalances[chainKey],
            [tokenKey]: balance,
          },
        },
        updatedAt: new Date().toISOString(),
      };
    }),
  clearEvmBalances: () => set({ ...initialState }),
}));
