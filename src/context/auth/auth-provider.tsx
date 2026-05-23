"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import {
  connectTradingWallet,
  disconnectTradingSession,
  loadTradingSession,
} from "@/components/trading/trading-wallet-session";
import { buildCashBalanceView } from "@/lib/trading/cash-balance-model";
import { postCollateralBalanceSync } from "@/lib/trading/sync-collateral-balance";
import { fetchJson } from "@/lib/team/client-fetch";
import type { CashBalanceView, FundingLoadStatus } from "@/types/funding";
import type { TradingUserSession, UserTradingReadiness } from "@/types/market";
import { AuthContext, type AuthContextValue } from "@/context/auth/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TradingUserSession | undefined>();
  const [status, setStatus] = useState<FundingLoadStatus>("idle");
  const [cash, setCash] = useState<CashBalanceView | undefined>();
  const [cashStatus, setCashStatus] = useState<FundingLoadStatus>("idle");
  const [error, setError] = useState<string | undefined>();
  const [cashError, setCashError] = useState<string | undefined>();
  const syncingRef = useRef(false);

  const refreshCash = useCallback(async () => {
    if (!session) {
      setCash(undefined);
      setCashStatus("ready");
      setCashError(undefined);
      return;
    }

    setCashStatus("loading");
    setCashError(undefined);

    try {
      const readiness = await fetchJson<UserTradingReadiness>("/api/trading/readiness");
      const nextCash = buildCashBalanceView(readiness);
      setCash(nextCash);
      setCashStatus("ready");
    } catch (refreshError) {
      setCashStatus("error");
      setCashError(refreshError instanceof Error ? refreshError.message : String(refreshError));
    }
  }, [session]);

  const refreshSession = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      const nextSession = await loadTradingSession();
      setSession(nextSession);
      setStatus("ready");

      if (!nextSession) {
        setCash(undefined);
        setCashStatus("ready");
        setCashError(undefined);
      }
    } catch (sessionError) {
      setStatus("error");
      setError(sessionError instanceof Error ? sessionError.message : String(sessionError));
    }
  }, []);

  const syncCash = useCallback(async () => {
    if (!session) {
      throw new Error("Connect a wallet before syncing collateral balance.");
    }

    if (syncingRef.current) {
      return;
    }

    syncingRef.current = true;
    setCashStatus("loading");
    setCashError(undefined);

    try {
      await postCollateralBalanceSync();
      await refreshCash();
    } catch (syncError) {
      setCashStatus("error");
      setCashError(syncError instanceof Error ? syncError.message : String(syncError));
      throw syncError;
    } finally {
      syncingRef.current = false;
    }
  }, [refreshCash, session]);

  const connectWallet = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      const nextSession = await connectTradingWallet();
      setSession(nextSession);
      setStatus("ready");
    } catch (connectError) {
      setStatus("error");
      setError(connectError instanceof Error ? connectError.message : String(connectError));
      throw connectError;
    }
  }, []);

  const disconnect = useCallback(async () => {
    setStatus("loading");
    setError(undefined);

    try {
      await disconnectTradingSession();
      setSession(undefined);
      setCash(undefined);
      setCashStatus("ready");
      setCashError(undefined);
      setStatus("ready");
    } catch (disconnectError) {
      setStatus("error");
      setError(disconnectError instanceof Error ? disconnectError.message : String(disconnectError));
      throw disconnectError;
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (session && status === "ready") {
      void refreshCash();
    }
  }, [session, status, refreshCash]);

  const value: AuthContextValue = {
    session,
    status,
    cash,
    cashStatus,
    error,
    cashError,
    connectWallet,
    disconnect,
    refreshSession,
    refreshCash,
    syncCash,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
