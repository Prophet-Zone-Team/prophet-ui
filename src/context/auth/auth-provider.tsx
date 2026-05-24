"use client";

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { LoginModal } from "@/components/auth/login-modal";
import { writeActiveQuickBidWalletAddress } from "@/components/trading/quick-bid-amount";
import {
  disconnectTradingSession,
  loadTradingSession,
} from "@/components/trading/trading-wallet-session";
import { AuthContext, type AuthContextValue } from "@/context/auth/auth-context";
import { buildCashBalanceView } from "@/lib/trading/cash-balance-model";
import {
  completeTradingLogin,
  ensureClobCredentials,
  ensureDepositWalletDeployed,
  ensureTokenApprovals,
} from "@/lib/trading/trading-login";
import { postCollateralBalanceSync } from "@/lib/trading/sync-collateral-balance";
import {
  inspectWalletConnection,
  subscribeWalletConnection,
} from "@/lib/trading/wallet-connection-watch";
import {
  getTradingSetupSteps,
  isSetupStepComplete,
  isTradingSetupComplete,
  shouldAutoOpenTradingSetupModal,
  type TradingSetupStepId,
} from "@/lib/trading/trading-setup";
import { fetchJson } from "@/lib/team/client-fetch";
import { selectIsAuthenticated, useAuthStore } from "@/store/auth-store";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import type { TradingUserSession, UserTradingReadiness } from "@/types/market";

export function AuthProvider({ children }: { children: ReactNode }) {
  const hydrated = useAuthHydrated();
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const readiness = useAuthStore((state) => state.readiness);
  const status = useAuthStore((state) => state.status);
  const loginStep = useAuthStore((state) => state.loginStep);
  const loginModalOpen = useAuthStore((state) => state.loginModalOpen);
  const loginInProgress = useAuthStore((state) => state.loginInProgress);
  const cash = useAuthStore((state) => state.cash);
  const cashStatus = useAuthStore((state) => state.cashStatus);
  const error = useAuthStore((state) => state.error);
  const cashError = useAuthStore((state) => state.cashError);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const setupSteps = useMemo(() => getTradingSetupSteps(readiness), [readiness]);

  const syncingRef = useRef(false);
  const loginAbortRef = useRef(false);
  const walletHandlingRef = useRef(false);

  const clearAuthState = useCallback(
    async (options?: { error?: string; openModal?: boolean }) => {
      const store = useAuthStore.getState();

      try {
        await disconnectTradingSession();
      } catch {
        // ignore disconnect errors during cleanup
      }

      writeActiveQuickBidWalletAddress(undefined);
      store.clearAuth();
      store.setLoginInProgress(false);
      store.setLoginStep(undefined);
      store.setStatus("ready");

      if (options?.error) {
        store.setError(options.error);
      }

      if (options?.openModal !== false) {
        store.setLoginModalOpen(true);
      }
    },
    [],
  );

  const handleWalletDisconnected = useCallback(async () => {
    const store = useAuthStore.getState();

    if (!store.session || walletHandlingRef.current) {
      return;
    }

    await clearAuthState({
      error: "Wallet disconnected. Connect again to continue.",
    });
  }, [clearAuthState]);

  const refreshCash = useCallback(async () => {
    const store = useAuthStore.getState();
    const currentSession = store.session;

    if (!currentSession) {
      store.clearCash();
      return;
    }

    store.setCashStatus("loading");
    store.setCashError(undefined);

    try {
      const nextReadiness = await fetchJson<UserTradingReadiness>("/api/trading/readiness");
      store.setReadiness(nextReadiness);
      store.setCash(buildCashBalanceView(nextReadiness));
      store.setCashStatus("ready");
    } catch (refreshError) {
      store.setCashStatus("error");
      store.setCashError(refreshError instanceof Error ? refreshError.message : String(refreshError));
    }
  }, []);

  const maybeCloseSetupModal = useCallback(
    (nextReadiness: UserTradingReadiness | undefined) => {
      const store = useAuthStore.getState();

      if (isTradingSetupComplete(nextReadiness)) {
        store.setLoginModalOpen(false);
        store.setLoginStep(undefined);
        store.setError(undefined);
        void refreshCash();
      }
    },
    [refreshCash],
  );

  const handleWalletAccountSwitch = useCallback(
    async (nextAddress: string) => {
      const store = useAuthStore.getState();
      const currentAddress = store.session?.walletAddress;

      if (
        !currentAddress ||
        walletHandlingRef.current ||
        currentAddress.toLowerCase() === nextAddress.toLowerCase()
      ) {
        return;
      }

      walletHandlingRef.current = true;
      loginAbortRef.current = false;

      try {
        await clearAuthState({
          error: "Active wallet changed. Reconnecting…",
          openModal: true,
        });

        const activeStore = useAuthStore.getState();
        activeStore.setLoginInProgress(true);
        activeStore.setStatus("loading");
        activeStore.setLoginStep(undefined);

        const result = await completeTradingLogin({
          resume: false,
          onStep: (step) => {
            if (!loginAbortRef.current) {
              useAuthStore.getState().setLoginStep(step);
            }
          },
        });

        if (loginAbortRef.current) {
          return;
        }

        activeStore.setSession(result.session);
        activeStore.setReadiness(result.readiness);
        activeStore.setStatus("ready");
        activeStore.setLoginStep(undefined);
        maybeCloseSetupModal(result.readiness);

        if (!isTradingSetupComplete(result.readiness)) {
          activeStore.setLoginModalOpen(true);
        }
      } catch (switchError) {
        if (!loginAbortRef.current) {
          useAuthStore.getState().setStatus("error");
          useAuthStore.getState().setError(
            switchError instanceof Error ? switchError.message : String(switchError),
          );
          useAuthStore.getState().setLoginModalOpen(true);
        }
      } finally {
        walletHandlingRef.current = false;
        if (!loginAbortRef.current) {
          useAuthStore.getState().setLoginInProgress(false);
        }
      }
    },
    [clearAuthState, maybeCloseSetupModal],
  );

  const refreshReadiness = useCallback(async (nextSession?: TradingUserSession) => {
    const store = useAuthStore.getState();

    if (!nextSession) {
      store.setReadiness(undefined);
      return undefined;
    }

    const nextReadiness = await fetchJson<UserTradingReadiness>("/api/trading/readiness");
    store.setReadiness(nextReadiness);
    return nextReadiness;
  }, []);

  const pollSetupReadiness = useCallback(
    async (nextSession: TradingUserSession, step: TradingSetupStepId) => {
      const startedAt = Date.now();
      const pollTimeoutMs = 30000;
      const pollIntervalMs = 2000;

      while (Date.now() - startedAt < pollTimeoutMs) {
        const nextReadiness = await refreshReadiness(nextSession);

        if (isSetupStepComplete(nextReadiness, step)) {
          return nextReadiness;
        }

        await new Promise((resolve) => {
          window.setTimeout(resolve, pollIntervalMs);
        });
      }

      return refreshReadiness(nextSession);
    },
    [refreshReadiness],
  );

  const openSetupModalIfNeeded = useCallback(() => {
    const store = useAuthStore.getState();

    if (
      shouldAutoOpenTradingSetupModal({
        session: store.session,
        readiness: store.readiness,
      })
    ) {
      store.setLoginModalOpen(true);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const store = useAuthStore.getState();

    store.setLoginInProgress(true);
    store.setStatus("loading");
    store.setError(undefined);
    walletHandlingRef.current = true;

    try {
      const nextSession = await loadTradingSession();

      if (!nextSession) {
        store.clearAuth();
        store.setLoginInProgress(false);
        store.setStatus("ready");
        openSetupModalIfNeeded();
        return;
      }

      store.setSession(nextSession);

      const walletSnapshot = await inspectWalletConnection(nextSession.walletAddress);

      if (walletSnapshot.status === "disconnected") {
        await clearAuthState({
          error: "Wallet disconnected. Connect again to continue.",
        });
        return;
      }

      if (walletSnapshot.status === "account_changed" && walletSnapshot.activeAccount) {
        await handleWalletAccountSwitch(walletSnapshot.activeAccount);
        return;
      }

      if (nextSession.depositWalletStatus !== "deployed") {
        await ensureDepositWalletDeployed(nextSession.walletAddress, {
          onStep: (step) => store.setLoginStep(step),
        });
      }

      const nextReadiness = await refreshReadiness(nextSession);
      store.setStatus("ready");
      store.setLoginStep(undefined);

      if (isTradingSetupComplete(nextReadiness)) {
        store.setLoginModalOpen(false);
        store.setError(undefined);
      } else {
        openSetupModalIfNeeded();
      }
    } catch (sessionError) {
      store.setStatus("error");
      store.setError(sessionError instanceof Error ? sessionError.message : String(sessionError));
    } finally {
      store.setLoginInProgress(false);
      walletHandlingRef.current = false;
    }
  }, [clearAuthState, handleWalletAccountSwitch, openSetupModalIfNeeded, refreshReadiness]);

  const syncCash = useCallback(async () => {
    const store = useAuthStore.getState();

    if (!store.session) {
      throw new Error("Connect a wallet before syncing collateral balance.");
    }

    if (syncingRef.current) {
      return;
    }

    syncingRef.current = true;
    store.setCashStatus("loading");
    store.setCashError(undefined);

    try {
      await postCollateralBalanceSync();
      await refreshCash();
    } catch (syncError) {
      store.setCashStatus("error");
      store.setCashError(syncError instanceof Error ? syncError.message : String(syncError));
      throw syncError;
    } finally {
      syncingRef.current = false;
    }
  }, [refreshCash]);

  const runLogin = useCallback(async (resume: boolean) => {
    const store = useAuthStore.getState();

    loginAbortRef.current = false;
    store.setLoginInProgress(true);
    store.setLoginModalOpen(true);
    store.setStatus("loading");
    store.setError(undefined);
    store.setLoginStep(undefined);

    try {
      const result = await completeTradingLogin({
        resume,
        onStep: (step) => {
          if (!loginAbortRef.current) {
            useAuthStore.getState().setLoginStep(step);
          }
        },
      });

      if (loginAbortRef.current) {
        return undefined;
      }

      store.setSession(result.session);
      store.setReadiness(result.readiness);
      store.setStatus("ready");
      store.setLoginStep(undefined);
      maybeCloseSetupModal(result.readiness);

      return result;
    } catch (loginError) {
      if (loginAbortRef.current) {
        return undefined;
      }

      store.setSession(undefined);
      store.setReadiness(undefined);
      store.setStatus("error");
      store.setError(loginError instanceof Error ? loginError.message : String(loginError));
      store.setLoginStep(undefined);
      throw loginError;
    } finally {
      if (!loginAbortRef.current) {
        store.setLoginInProgress(false);
      }
    }
  }, [maybeCloseSetupModal]);

  const refreshSetupReadiness = useCallback(async () => {
    const store = useAuthStore.getState();
    const currentSession = store.session;

    if (!currentSession) {
      return undefined;
    }

    const nextReadiness = await refreshReadiness(currentSession);
    maybeCloseSetupModal(nextReadiness);
    return nextReadiness;
  }, [maybeCloseSetupModal, refreshReadiness]);

  const runSignStep = useCallback(
    async (action: "clob" | "tokens") => {
      const store = useAuthStore.getState();
      const currentSession = store.session;

      if (!currentSession) {
        throw new Error("Connect a wallet first.");
      }

      store.setLoginInProgress(true);
      store.setLoginModalOpen(true);
      store.setError(undefined);

      const setupStep: TradingSetupStepId = action === "clob" ? "clob" : "tokens";

      try {
        store.setLoginStep(action === "clob" ? "checking_clob_credentials" : "checking_token_approval");

        let nextReadiness = await refreshReadiness(currentSession);

        if (isSetupStepComplete(nextReadiness, setupStep)) {
          store.setLoginStep(
            setupStep === "clob" ? "clob_already_derived" : "tokens_already_authorized",
          );
          maybeCloseSetupModal(nextReadiness);
          return;
        }

        if (action === "clob") {
          nextReadiness = await ensureClobCredentials(currentSession, {
            onStep: (step) => store.setLoginStep(step),
          });
        } else {
          nextReadiness = await ensureTokenApprovals(currentSession, {
            onStep: (step) => store.setLoginStep(step),
          });
        }

        store.setReadiness(nextReadiness);

        if (!isSetupStepComplete(nextReadiness, setupStep)) {
          nextReadiness = (await pollSetupReadiness(currentSession, setupStep)) ?? nextReadiness;
        }

        maybeCloseSetupModal(nextReadiness);
      } catch (stepError) {
        store.setError(stepError instanceof Error ? stepError.message : String(stepError));
        throw stepError;
      } finally {
        store.setLoginInProgress(false);
        store.setLoginStep(undefined);
      }
    },
    [maybeCloseSetupModal, pollSetupReadiness, refreshReadiness],
  );

  const openLogin = useCallback(async () => {
    return runLogin(Boolean(useAuthStore.getState().session));
  }, [runLogin]);

  const connectWallet = openLogin;

  const retryLogin = useCallback(async () => {
    return runLogin(true);
  }, [runLogin]);

  const signClobCredentials = useCallback(async () => {
    await runSignStep("clob");
  }, [runSignStep]);

  const signTokenApprovals = useCallback(async () => {
    await runSignStep("tokens");
  }, [runSignStep]);

  const closeLogin = useCallback(async () => {
    const store = useAuthStore.getState();

    loginAbortRef.current = true;

    if (store.loginInProgress) {
      await clearAuthState({ openModal: false });
    } else {
      store.setLoginInProgress(false);
      store.setLoginStep(undefined);
      store.setLoginModalOpen(false);
      store.setError(undefined);
    }
  }, [clearAuthState]);

  const disconnect = useCallback(async () => {
    const store = useAuthStore.getState();

    loginAbortRef.current = true;
    walletHandlingRef.current = true;
    store.setStatus("loading");
    store.setError(undefined);
    store.setLoginInProgress(false);
    store.setLoginStep(undefined);
    store.setLoginModalOpen(false);

    try {
      await clearAuthState({ openModal: false });
      store.setError(undefined);
    } catch (disconnectError) {
      store.setStatus("error");
      store.setError(disconnectError instanceof Error ? disconnectError.message : String(disconnectError));
      throw disconnectError;
    } finally {
      walletHandlingRef.current = false;
    }
  }, [clearAuthState]);

  useEffect(() => {
    if (!hydrated || !session?.walletAddress) {
      return;
    }

    return subscribeWalletConnection({
      expectedAddress: session.walletAddress,
      isPaused: () => walletHandlingRef.current,
      onDisconnected: () => {
        void handleWalletDisconnected();
      },
      onAccountChanged: (nextAddress) => {
        void handleWalletAccountSwitch(nextAddress);
      },
    });
  }, [handleWalletAccountSwitch, handleWalletDisconnected, hydrated, session?.walletAddress]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void refreshSession();
  }, [hydrated, refreshSession]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    openSetupModalIfNeeded();
  }, [hydrated, pathname, openSetupModalIfNeeded, session, readiness]);

  useEffect(() => {
    if (session && status === "ready" && setupSteps.clobSigned) {
      void refreshCash();
    }
  }, [session, setupSteps.clobSigned, status, refreshCash]);
  const value: AuthContextValue = {
    session,
    readiness,
    setupSteps,
    isAuthenticated,
    hydrated,
    status: hydrated ? status : "loading",
    loginStep,
    loginModalOpen,
    loginInProgress,
    cash,
    cashStatus,
    error,
    cashError,
    openLogin,
    connectWallet,
    retryLogin,
    signClobCredentials,
    signTokenApprovals,
    closeLogin,
    disconnect,
    refreshSession,
    refreshSetupReadiness,
    refreshCash,
    syncCash,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal auth={value} />
    </AuthContext.Provider>
  );
}
