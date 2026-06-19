"use client";

import { create } from "zustand";

import type { ChainType } from "@/lib/wallet/types";

export type FundingWalletChainType = ChainType | "near";

export interface FundingWalletSlice {
  address?: string;
  connected: boolean;
  walletName?: string;
  connecting: boolean;
}

const fundingConnectHandlers: Partial<
  Record<FundingWalletChainType, () => Promise<string | undefined>>
> = {};

const fundingDisconnectHandlers: Partial<
  Record<FundingWalletChainType, () => Promise<void>>
> = {};

interface FundingWalletStore {
  evm: FundingWalletSlice;
  solana: FundingWalletSlice;
  tron: FundingWalletSlice;
  near: FundingWalletSlice;
  setSlice: (chainType: FundingWalletChainType, slice: Partial<FundingWalletSlice>) => void;
  registerConnectHandler: (
    chainType: FundingWalletChainType,
    handler: () => Promise<string | undefined>,
  ) => void;
  registerDisconnectHandler: (
    chainType: FundingWalletChainType,
    handler: () => Promise<void>,
  ) => void;
  resetSlice: (chainType: FundingWalletChainType) => void;
}

const emptySlice = (): FundingWalletSlice => ({
  connected: false,
  connecting: false,
});

const initialState = {
  evm: emptySlice(),
  solana: emptySlice(),
  tron: emptySlice(),
  near: emptySlice(),
};

function sliceEquals(
  current: FundingWalletSlice,
  patch: Partial<FundingWalletSlice>,
): boolean {
  const next: FundingWalletSlice = { ...current, ...patch };

  return (
    current.address === next.address &&
    current.connected === next.connected &&
    current.connecting === next.connecting &&
    current.walletName === next.walletName
  );
}

export const useFundingWalletStore = create<FundingWalletStore>((set, get) => ({
  ...initialState,
  setSlice: (chainType, slice) => {
    const current = get()[chainType];

    if (sliceEquals(current, slice)) {
      return;
    }

    set({
      [chainType]: {
        ...current,
        ...slice,
      },
    });
  },
  registerConnectHandler: (chainType, handler) => {
    fundingConnectHandlers[chainType] = handler;
  },
  registerDisconnectHandler: (chainType, handler) => {
    fundingDisconnectHandlers[chainType] = handler;
  },
  resetSlice: (chainType) =>
    set({
      [chainType]: emptySlice(),
    }),
}));

export function getFundingWalletConnectHandler(
  chainType: FundingWalletChainType,
): (() => Promise<string | undefined>) | undefined {
  return fundingConnectHandlers[chainType];
}

export function getFundingWalletDisconnectHandler(
  chainType: FundingWalletChainType,
): (() => Promise<void>) | undefined {
  return fundingDisconnectHandlers[chainType];
}

export function getFundingWalletSlice(
  chainType: FundingWalletChainType,
): FundingWalletSlice {
  return useFundingWalletStore.getState()[chainType];
}

export function getFundingWalletAddress(
  chainType: FundingWalletChainType,
): string | undefined {
  const slice = getFundingWalletSlice(chainType);
  return slice.connected ? slice.address : undefined;
}
