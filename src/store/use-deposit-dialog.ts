"use client";

import { create } from "zustand";

type DepositDialogSuccessHandler = () => void | Promise<void>;

interface DepositDialogOpenOptions {
  onSuccess?: DepositDialogSuccessHandler;
}

interface DepositDialogState {
  isOpen: boolean;
  onSuccess?: DepositDialogSuccessHandler;
  open: (options?: DepositDialogOpenOptions) => void;
  close: () => void;
  consumeOnSuccess: () => DepositDialogSuccessHandler | undefined;
}

export const useDepositDialogStore = create<DepositDialogState>((set, get) => ({
  isOpen: false,
  onSuccess: undefined,
  open: (options) => {
    set({
      isOpen: true,
      onSuccess: options?.onSuccess,
    });
  },
  close: () => {
    set({
      isOpen: false,
      onSuccess: undefined,
    });
  },
  consumeOnSuccess: () => {
    const handler = get().onSuccess;
    set({ onSuccess: undefined });
    return handler;
  },
}));
