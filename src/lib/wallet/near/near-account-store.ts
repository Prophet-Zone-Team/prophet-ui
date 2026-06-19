import { create } from "zustand";
import type { WalletSelector } from "@near-wallet-selector/core";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";

export interface NearAccountState {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accountId: string | null;
  derivedEvmAddress: string | null;
  evmDerivationRequested: boolean;
  walletName?: string;
  walletIcon?: string;
  set: (partial: Partial<Omit<NearAccountState, "set" | "reset">>) => void;
  reset: () => void;
}

const INITIAL_STATE: Omit<NearAccountState, "set" | "reset"> = {
  selector: null,
  modal: null,
  accountId: null,
  derivedEvmAddress: null,
  evmDerivationRequested: false,
  walletName: undefined,
  walletIcon: undefined,
};

export const useNearAccountStore = create<NearAccountState>((set) => ({
  ...INITIAL_STATE,
  set: (partial) => set(partial),
  reset: () =>
    set((state) => ({
      ...INITIAL_STATE,
      selector: state.selector,
      modal: state.modal,
    })),
}));

export function getNearAccountSnapshot() {
  return useNearAccountStore.getState();
}
