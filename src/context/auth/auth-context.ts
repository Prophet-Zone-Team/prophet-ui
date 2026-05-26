"use client";

import { createContext } from "react";

import type { TradingLoginStep } from "@/lib/trading/trading-login";
import type { TradingEligibilityView } from "@/lib/trading/trading-eligibility-client";
import type { TradingSetupSteps } from "@/lib/trading/trading-setup";
import type { CashBalanceView, FundingLoadStatus } from "@/types/funding";
import type { TradingUserSession, UserTradingReadiness } from "@/types/market";
import type { EligibilityLoadStatus } from "@/store/auth-store";

export interface AuthContextValue {
  session: TradingUserSession | undefined;
  readiness: UserTradingReadiness | undefined;
  setupSteps: TradingSetupSteps;
  isAuthenticated: boolean;
  hydrated: boolean;
  status: FundingLoadStatus;
  loginStep: TradingLoginStep | undefined;
  loginModalOpen: boolean;
  loginInProgress: boolean;
  cash: CashBalanceView | undefined;
  cashStatus: FundingLoadStatus;
  error: string | undefined;
  cashError: string | undefined;
  eligibilityView: TradingEligibilityView | undefined;
  eligibilityLoadStatus: EligibilityLoadStatus;
  isRegionBlocked: boolean;
  openLoginModalOnly: () => void;
  refreshEligibility: () => Promise<TradingEligibilityView | undefined>;
  openLogin: () => Promise<{ session: TradingUserSession; readiness: UserTradingReadiness } | undefined>;
  connectWallet: () => Promise<{ session: TradingUserSession; readiness: UserTradingReadiness } | undefined>;
  retryLogin: () => Promise<{ session: TradingUserSession; readiness: UserTradingReadiness } | undefined>;
  signClobCredentials: () => Promise<void>;
  signTokenApprovals: () => Promise<void>;
  closeLogin: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshSetupReadiness: () => Promise<UserTradingReadiness | undefined>;
  refreshCash: () => Promise<void>;
  syncCash: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
