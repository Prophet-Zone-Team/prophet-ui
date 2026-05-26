"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { TradingLoginStep } from "@/lib/trading/trading-login";
import {
  resolveEligibilityView,
  resolveIsRegionBlocked,
  type TradingEligibilityView,
} from "@/lib/trading/trading-eligibility-client";
import { isTradingSetupComplete } from "@/lib/trading/trading-setup";
import type { CashBalanceView, FundingLoadStatus } from "@/types/funding";
import type { TradingUserSession, UserTradingReadiness } from "@/types/market";

export type EligibilityLoadStatus = "idle" | "loading" | "ready";

interface AuthPersistedState {
  session: TradingUserSession | undefined;
  readiness: UserTradingReadiness | undefined;
  loginStep: TradingLoginStep | undefined;
  status: FundingLoadStatus;
  loginModalOpen: boolean;
  error: string | undefined;
}

interface AuthStore extends AuthPersistedState {
  loginInProgress: boolean;
  cash: CashBalanceView | undefined;
  cashStatus: FundingLoadStatus;
  cashError: string | undefined;
  standaloneEligibility: TradingEligibilityView | undefined;
  eligibilityLoadStatus: EligibilityLoadStatus;
  setStandaloneEligibility: (standaloneEligibility: TradingEligibilityView | undefined) => void;
  setEligibilityLoadStatus: (eligibilityLoadStatus: EligibilityLoadStatus) => void;
  setSession: (session: TradingUserSession | undefined) => void;
  setReadiness: (readiness: UserTradingReadiness | undefined) => void;
  setLoginStep: (loginStep: TradingLoginStep | undefined) => void;
  setStatus: (status: FundingLoadStatus) => void;
  setLoginModalOpen: (loginModalOpen: boolean) => void;
  setLoginInProgress: (loginInProgress: boolean) => void;
  setError: (error: string | undefined) => void;
  setCash: (cash: CashBalanceView | undefined) => void;
  setCashStatus: (cashStatus: FundingLoadStatus) => void;
  setCashError: (cashError: string | undefined) => void;
  clearAuth: () => void;
  clearCash: () => void;
}

const initialPersistedState: AuthPersistedState = {
  session: undefined,
  readiness: undefined,
  loginStep: undefined,
  status: "idle",
  loginModalOpen: false,
  error: undefined,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialPersistedState,
      loginInProgress: false,
      cash: undefined,
      cashStatus: "idle",
      cashError: undefined,
      standaloneEligibility: undefined,
      eligibilityLoadStatus: "idle",
      setStandaloneEligibility: (standaloneEligibility) => set({ standaloneEligibility }),
      setEligibilityLoadStatus: (eligibilityLoadStatus) => set({ eligibilityLoadStatus }),
      setSession: (session) => set({ session }),
      setReadiness: (readiness) => set({ readiness }),
      setLoginStep: (loginStep) => set({ loginStep }),
      setStatus: (status) => set({ status }),
      setLoginModalOpen: (loginModalOpen) => set({ loginModalOpen }),
      setLoginInProgress: (loginInProgress) => set({ loginInProgress }),
      setError: (error) => set({ error }),
      setCash: (cash) => set({ cash }),
      setCashStatus: (cashStatus) => set({ cashStatus }),
      setCashError: (cashError) => set({ cashError }),
      clearAuth: () =>
        set({
          ...initialPersistedState,
          loginInProgress: false,
          cash: undefined,
          cashStatus: "ready",
          cashError: undefined,
        }),
      clearCash: () =>
        set({
          cash: undefined,
          cashStatus: "ready",
          cashError: undefined,
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
        };
      },
    },
  ),
);

export function selectIsAuthenticated(state: AuthStore) {
  return isTradingSetupComplete(state.readiness);
}

export function selectEligibilityView(state: AuthStore) {
  return resolveEligibilityView(state.session, state.standaloneEligibility);
}

export function selectIsRegionBlocked(state: AuthStore) {
  return resolveIsRegionBlocked(state.session, state.standaloneEligibility);
}
