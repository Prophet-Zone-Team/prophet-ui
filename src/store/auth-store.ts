"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ConfidentialBalanceView } from "@/lib/confidential/types";
import type { TradingLoginStep } from "@/lib/trading/trading-login";
import { isTradingSetupComplete } from "@/lib/trading/trading-setup";
import type { CashBalanceView, FundingLoadStatus } from "@/types/funding";
import type { TradingUserSession, UserTradingReadiness } from "@/types/market";

export type AuthLoginMethod = "wallet" | "email" | "google";

interface AuthPersistedState {
  session: TradingUserSession | undefined;
  readiness: UserTradingReadiness | undefined;
  loginStep: TradingLoginStep | undefined;
  status: FundingLoadStatus;
  loginModalOpen: boolean;
  error: string | undefined;
  loginMethod: AuthLoginMethod | undefined;
}

interface AuthStore extends AuthPersistedState {
  loginInProgress: boolean;
  privyLoginInProgress: boolean;
  cash: CashBalanceView | undefined;
  cashStatus: FundingLoadStatus;
  cashError: string | undefined;
  privateBalance: ConfidentialBalanceView | undefined;
  privateBalanceStatus: FundingLoadStatus;
  privateBalanceError: string | undefined;
  setSession: (session: TradingUserSession | undefined) => void;
  setReadiness: (readiness: UserTradingReadiness | undefined) => void;
  setLoginStep: (loginStep: TradingLoginStep | undefined) => void;
  setStatus: (status: FundingLoadStatus) => void;
  setLoginModalOpen: (loginModalOpen: boolean) => void;
  setLoginInProgress: (loginInProgress: boolean) => void;
  setPrivyLoginInProgress: (privyLoginInProgress: boolean) => void;
  setLoginMethod: (loginMethod: AuthLoginMethod | undefined) => void;
  setError: (error: string | undefined) => void;
  setCash: (cash: CashBalanceView | undefined) => void;
  setCashStatus: (cashStatus: FundingLoadStatus) => void;
  setCashError: (cashError: string | undefined) => void;
  setPrivateBalance: (privateBalance: ConfidentialBalanceView | undefined) => void;
  setPrivateBalanceStatus: (privateBalanceStatus: FundingLoadStatus) => void;
  setPrivateBalanceError: (privateBalanceError: string | undefined) => void;
  clearAuth: () => void;
  clearCash: () => void;
  clearPrivateBalance: () => void;
}

const initialPersistedState: AuthPersistedState = {
  session: undefined,
  readiness: undefined,
  loginStep: undefined,
  status: "idle",
  loginModalOpen: false,
  error: undefined,
  loginMethod: undefined,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialPersistedState,
      loginInProgress: false,
      privyLoginInProgress: false,
      cash: undefined,
      cashStatus: "idle",
      cashError: undefined,
      privateBalance: undefined,
      privateBalanceStatus: "idle",
      privateBalanceError: undefined,
      setSession: (session) => set({ session }),
      setReadiness: (readiness) => set({ readiness }),
      setLoginStep: (loginStep) => set({ loginStep }),
      setStatus: (status) => set({ status }),
      setLoginModalOpen: (loginModalOpen) => set({ loginModalOpen }),
      setLoginInProgress: (loginInProgress) => set({ loginInProgress }),
      setPrivyLoginInProgress: (privyLoginInProgress) => set({ privyLoginInProgress }),
      setLoginMethod: (loginMethod) => {
        console.log("%c setLoginMethod on store: %o", "background: red; color: white;", loginMethod)
        return set({ loginMethod });
      },
      setError: (error) => set({ error }),
      setCash: (cash) => set({ cash }),
      setCashStatus: (cashStatus) => set({ cashStatus }),
      setCashError: (cashError) => set({ cashError }),
      setPrivateBalance: (privateBalance) => set({ privateBalance }),
      setPrivateBalanceStatus: (privateBalanceStatus) => set({ privateBalanceStatus }),
      setPrivateBalanceError: (privateBalanceError) => set({ privateBalanceError }),
      clearAuth: () =>
        set((state) => ({
          ...initialPersistedState,
          loginMethod: state.loginMethod,
          loginInProgress: false,
          cash: undefined,
          cashStatus: "ready",
          cashError: undefined,
          privateBalance: undefined,
          privateBalanceStatus: "idle",
          privateBalanceError: undefined,
        })),
      clearCash: () =>
        set({
          cash: undefined,
          cashStatus: "ready",
          cashError: undefined,
        }),
      clearPrivateBalance: () =>
        set({
          privateBalance: undefined,
          privateBalanceStatus: "idle",
          privateBalanceError: undefined,
        }),
    }),
    {
      name: "wc-auth",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        readiness: state.readiness,
        loginStep: state.loginStep,
        status: state.status,
        loginModalOpen: state.loginModalOpen,
        error: state.error,
        loginMethod: state.loginMethod,
      }),
      migrate: (persisted) => {
        const state = persisted as Partial<AuthPersistedState> | undefined;

        return {
          session: state?.session,
          readiness: state?.readiness,
          loginStep: state?.loginStep,
          status: state?.status ?? "idle",
          loginModalOpen: state?.loginModalOpen ?? false,
          error: state?.error,
          loginMethod: state?.loginMethod,
        };
      },
    },
  ),
);

export function selectIsAuthenticated(state: AuthStore) {
  return isTradingSetupComplete(state.readiness);
}
