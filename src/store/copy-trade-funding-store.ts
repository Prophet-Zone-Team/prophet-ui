"use client";

import { create } from "zustand";

import {
  getCopyTradeDepositSupportedAssets,
  getCopyTradeWithdrawalSupportedAssets,
} from "@/service/copy-trade/endpoints";
import type {
  CopyBridgeSupportedAsset,
  CopyWithdrawalAssetInfo,
} from "@/types/copy-trade-funding";
import { getTokenLogo } from "@/utils/logo";
import Big from "big.js";

interface CopyTradeFundingState {
  depositOpen: boolean;
  withdrawOpen: boolean;

  depositAssets: CopyBridgeSupportedAsset[];
  depositAssetsLoaded: boolean;
  depositAssetsLoading: boolean;

  withdrawalAssets: CopyWithdrawalAssetInfo[];
  withdrawalAssetsLoaded: boolean;
  withdrawalAssetsLoading: boolean;

  openDeposit: () => void;
  closeDeposit: () => void;
  openWithdraw: () => void;
  closeWithdraw: () => void;

  loadDepositAssets: (force?: boolean) => Promise<CopyBridgeSupportedAsset[]>;
  loadWithdrawalAssets: (
    force?: boolean,
  ) => Promise<CopyWithdrawalAssetInfo[]>;
}

export const useCopyTradeFundingStore = create<CopyTradeFundingState>(
  (set, get) => ({
    depositOpen: false,
    withdrawOpen: false,

    depositAssets: [],
    depositAssetsLoaded: false,
    depositAssetsLoading: false,

    withdrawalAssets: [],
    withdrawalAssetsLoaded: false,
    withdrawalAssetsLoading: false,

    openDeposit: () => set({ depositOpen: true, withdrawOpen: false }),
    closeDeposit: () => set({ depositOpen: false }),
    openWithdraw: () => set({ withdrawOpen: true, depositOpen: false }),
    closeWithdraw: () => set({ withdrawOpen: false }),

    loadDepositAssets: async (force = false) => {
      const state = get();
      if (!force && state.depositAssetsLoaded) {
        return state.depositAssets;
      }
      if (state.depositAssetsLoading) {
        return state.depositAssets;
      }

      set({ depositAssetsLoading: true });
      try {
        const items = await getCopyTradeDepositSupportedAssets();
        items.forEach((item) => {
          item.minCheckoutUsd = Big(item.minCheckoutUsd || 1).plus(1).toNumber();
        });
        set({
          depositAssets: items,
          depositAssetsLoaded: true,
          depositAssetsLoading: false,
        });
        return items;
      } catch (error) {
        set({ depositAssetsLoading: false });
        throw error;
      }
    },

    loadWithdrawalAssets: async (force = false) => {
      const state = get();
      if (!force && state.withdrawalAssetsLoaded) {
        return state.withdrawalAssets;
      }
      if (state.withdrawalAssetsLoading) {
        return state.withdrawalAssets;
      }

      set({ withdrawalAssetsLoading: true });
      try {
        const items = await getCopyTradeWithdrawalSupportedAssets();
        set({
          withdrawalAssets: items.map((item) => {
            if (item.asset === "usdc") {
              item.label = "USDC";
            }
            item.icon = getTokenLogo("usdc");
            return item;
          }),
          withdrawalAssetsLoaded: true,
          withdrawalAssetsLoading: false,
        });
        return items;
      } catch (error) {
        set({ withdrawalAssetsLoading: false });
        throw error;
      }
    },
  }),
);

export function openCopyTradeDeposit(): void {
  useCopyTradeFundingStore.getState().openDeposit();
}

export function openCopyTradeWithdraw(): void {
  useCopyTradeFundingStore.getState().openWithdraw();
}
