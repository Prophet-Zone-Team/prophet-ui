"use client";

import { createContext } from "react";

import type { ConfidentialBalanceView, ConfidentialSessionView } from "@/lib/confidential/types";
import type { TradingLoginStep } from "@/lib/trading/trading-login";
import type { TradingEligibilityView } from "@/lib/trading/trading-eligibility-client";
import type { TradingSetupSteps } from "@/lib/trading/trading-setup";
import type { CashBalanceView, FundingLoadStatus } from "@/types/funding";
import type { TradingUserSession, UserTradingReadiness } from "@/types/market";
import type { AuthLoginMethod } from "@/store/auth-store";
import { UseConfidentialAccountResult } from "@/hooks/confidential/use-confidential-account";
import { UsePendingFunderUsdcResult } from "@/hooks/funding";
export type EligibilityLoadStatus = "idle" | "loading" | "ready";

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
  privyLoginInProgress: boolean;
  cash: CashBalanceView | undefined;
  cashStatus: FundingLoadStatus;
  privateBalance: ConfidentialBalanceView | undefined;
  privateBalanceStatus: FundingLoadStatus;
  privateBalanceError: string | undefined;
  error: string | undefined;
  cashError: string | undefined;
  eligibilityView: TradingEligibilityView | undefined;
  eligibilityLoadStatus: EligibilityLoadStatus;
  /** Fully blocked: no trading actions including sell/cancel. */
  isRegionBlocked: boolean;
  /** Buy, deposit, and new setup restricted (fully blocked or close-only). */
  isBuyRestricted: boolean;
  /** Close-only region: sell/cancel allowed; buy/deposit blocked. */
  isRegionCloseOnly: boolean;
  loginMethod: AuthLoginMethod | undefined;
  privyModalOpen: boolean;
  privyReady: boolean;
  openLoginModalOnly: () => void;
  openPrivyLogin: () => void;
  closePrivyLogin: () => void;
  /** Call after Privy email OTP succeeds to start the trading setup flow. */
  completePrivyEmailLogin: (email: string) => void;
  setLoginMethod: (method: AuthLoginMethod | undefined) => void;
  refreshEligibility: () => Promise<TradingEligibilityView | undefined>;
  openLogin: (method?: AuthLoginMethod) => Promise<{ session: TradingUserSession; readiness: UserTradingReadiness } | undefined>;
  connectWallet: (method?: AuthLoginMethod) => Promise<{ session: TradingUserSession; readiness: UserTradingReadiness } | undefined>;
  signClobCredentials: () => Promise<void>;
  signTokenApprovals: () => Promise<void>;
  closeLogin: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshSetupReadiness: () => Promise<UserTradingReadiness | undefined>;
  refreshCash: () => Promise<void>;
  refreshPrivateBalance: (params?: { requiredSession?: boolean; }) => Promise<void>;
  onAuthenticateConfidential: () => Promise<ConfidentialSessionView>;
  confidentialAccount: UseConfidentialAccountResult;
  confirmPendingDeposit: UsePendingFunderUsdcResult;
  syncCash: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
