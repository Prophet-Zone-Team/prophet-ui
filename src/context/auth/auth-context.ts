"use client";

import { createContext } from "react";

import type { CashBalanceView, FundingLoadStatus } from "@/types/funding";
import type { TradingUserSession } from "@/types/market";

export interface AuthContextValue {
  session: TradingUserSession | undefined;
  status: FundingLoadStatus;
  cash: CashBalanceView | undefined;
  cashStatus: FundingLoadStatus;
  error: string | undefined;
  cashError: string | undefined;
  connectWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshCash: () => Promise<void>;
  syncCash: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
