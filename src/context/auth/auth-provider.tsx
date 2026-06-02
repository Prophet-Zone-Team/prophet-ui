"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { usePathname } from "next/navigation";

import { LoginModal } from "@/components/auth/login-modal";
import { disconnectWagmiWallet } from "@/components/trading/wallet-provider";
import {
  disconnectTradingSession,
  loadTradingSession
} from "@/components/trading/trading-wallet-session";
import {
  AuthContext,
  type AuthContextValue,
  type EligibilityLoadStatus
} from "@/context/auth/auth-context";
import { mapBalanceSnapshotToCash } from "@/lib/trading/cash-balance-model";
import { mergeTradingReadiness } from "@/lib/trading/merge-trading-readiness";
import {
  fetchTradingBalances,
  fetchTradingReadinessWithBalances,
} from "@/lib/trading/trading-login";
import {
  completeTradingLogin,
  ensureClobCredentials,
  ensureDepositWalletDeployed,
  ensureTokenApprovals
} from "@/lib/trading/trading-login";
import { postCollateralBalanceSync } from "@/lib/trading/sync-collateral-balance";
import {
  subscribeWalletConnection,
  inspectWalletConnection
} from "@/lib/trading/wallet-connection-watch";
import {
  getTradingSetupSteps,
  isSetupStepComplete,
  isTradingSetupComplete,
  shouldAutoOpenTradingSetupModal,
  type TradingSetupStepId
} from "@/lib/trading/trading-setup";
import { fetchJson } from "@/lib/team/client-fetch";
import {
  fetchTradingEligibility,
  isRegionBlocked as checkIsRegionBlocked,
  type TradingEligibilityView
} from "@/lib/trading/trading-eligibility-client";
import { resolveWalletErrorMessage } from "@/lib/trading/wallet-error-message";
import { useTracksStore } from "@/store/tracks-store";
import {
  logoutProphet,
  syncProphetWalletLogin
} from "@/service/prophet";
import { selectIsAuthenticated, useAuthStore } from "@/store/auth-store";
import type { AuthLoginMethod } from "@/store/auth-store";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import type { TradingUserSession, UserTradingReadiness } from "@/types/market";
import { useDisconnect } from "wagmi";
import {
  useLoginWithOAuth,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";

import {
  clearOAuthUrlParams,
  consumeOAuthPending,
  getOAuthReturnProvider,
  hasOAuthReturnParams,
  OAUTH_PENDING_STORAGE_KEY,
} from "@/context/privy/privy-oauth";
import { waitForPrivyWallet } from "@/context/privy/privy-wallet-bridge";

const ELIGIBILITY_REFRESH_INTERVAL_MS = 1000 * 60 * 5;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const {
    ready: privyReady,
    authenticated: privyAuthenticated,
    logout: privyLogout,
    createWallet,
  } = usePrivy();
  const { wallets: privyWallets } = useWallets();
  const startPrivyTradingLoginRef =
    useRef<(method: AuthLoginMethod) => Promise<void>>(async () => {});
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
  const loginMethod = useAuthStore((state) => state.loginMethod);
  const [privyModalOpen, setPrivyModalOpen] = useState(false);
  const oauthAutoConnectRef = useRef(false);
  const privyAutoLoginRef = useRef(false);
  const privyWalletCreatingRef = useRef(false);

  useLoginWithOAuth({
    onComplete: () => {
      void startPrivyTradingLoginRef.current("google");
    },
    onError: () => {
      consumeOAuthPending();
      clearOAuthUrlParams();
      privyAutoLoginRef.current = false;
      oauthAutoConnectRef.current = false;
    },
  });
  const [isRegionBlocked, setIsRegionBlocked] = useState(false);
  const [eligibilityView, setEligibilityView] = useState<
    TradingEligibilityView | undefined
  >();
  const [eligibilityLoadStatus, setEligibilityLoadStatus] =
    useState<EligibilityLoadStatus>("idle");
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const setupSteps = useMemo(
    () => getTradingSetupSteps(readiness),
    [readiness]
  );

  const syncingRef = useRef(false);
  const loginAbortRef = useRef(false);
  const loginConnectAbortRef = useRef<AbortController | undefined>(undefined);
  const walletHandlingRef = useRef(false);
  const eligibilityRefreshRef = useRef(false);
  const isRegionBlockedRef = useRef(false);
  const eligibilityViewRef = useRef<TradingEligibilityView | undefined>(
    undefined
  );

  useEffect(() => {
    isRegionBlockedRef.current = isRegionBlocked;
  }, [isRegionBlocked]);

  useEffect(() => {
    eligibilityViewRef.current = eligibilityView;
  }, [eligibilityView]);

  const refreshEligibility = useCallback(async () => {
    if (eligibilityRefreshRef.current) {
      return eligibilityViewRef.current;
    }

    eligibilityRefreshRef.current = true;
    setEligibilityLoadStatus("loading");

    try {
      const eligibility = await fetchTradingEligibility();
      setEligibilityView(eligibility);
      setIsRegionBlocked(checkIsRegionBlocked(eligibility.status));
      setEligibilityLoadStatus("ready");
      return eligibility;
    } catch (refreshError) {
      setEligibilityLoadStatus("ready");
      console.warn("[auth.eligibility] refresh failed", refreshError);
      return eligibilityViewRef.current;
    } finally {
      eligibilityRefreshRef.current = false;
    }
  }, []);

  const clearAuthState = useCallback(
    async (options?: { error?: string; openModal?: boolean }) => {
      const store = useAuthStore.getState();

      try {
        await disconnectTradingSession();
      } catch {
        // ignore disconnect errors during cleanup
      }

      try {
        await disconnectWagmiWallet();
      } catch {
        // ignore wagmi disconnect errors during cleanup
      }

      logoutProphet();
      useTracksStore.getState().reset();

      store.clearAuth();
      store.setLoginInProgress(false);
      store.setLoginStep(undefined);
      store.setStatus("ready");

      if (options?.error) {
        store.setError(options.error);
      }

      if (options?.openModal !== false) {
        if (!isRegionBlockedRef.current) {
          store.setLoginModalOpen(true);
        }
      }
    },
    []
  );

  const handleWalletDisconnected = useCallback(async () => {
    const store = useAuthStore.getState();

    if (!store.session || walletHandlingRef.current) {
      return;
    }

    await clearAuthState({
      error: "Wallet disconnected. Connect again to continue."
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
      const balances = await fetchTradingBalances();
      const setup =
        store.readiness ??
        (await fetchJson<UserTradingReadiness>("/api/trading/readiness"));
      const nextReadiness = mergeTradingReadiness(setup, balances);
      store.setReadiness(nextReadiness);
      store.setCash(
        balances.balances ? mapBalanceSnapshotToCash(balances.balances) : undefined
      );
      store.setCashStatus("ready");
    } catch (refreshError) {
      store.setCashStatus("error");
      store.setCashError(resolveWalletErrorMessage(refreshError));
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
    [refreshCash]
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
          openModal: true
        });

        const activeStore = useAuthStore.getState();
        activeStore.setLoginInProgress(true);
        activeStore.setStatus("loading");
        activeStore.setLoginStep(undefined);

        loginConnectAbortRef.current?.abort();
        loginConnectAbortRef.current = new AbortController();

        const result = await completeTradingLogin({
          resume: false,
          connectSignal: loginConnectAbortRef.current.signal,
          onStep: (step) => {
            if (!loginAbortRef.current) {
              useAuthStore.getState().setLoginStep(step);
            }
          }
        });

        if (loginAbortRef.current) {
          return;
        }

        activeStore.setSession(result.session);
        activeStore.setReadiness(result.readiness);
        activeStore.setStatus("ready");
        activeStore.setLoginStep(undefined);
        maybeCloseSetupModal(result.readiness);
        void syncProphetWalletLogin(result.session.walletAddress);

        if (!isTradingSetupComplete(result.readiness)) {
          activeStore.setLoginModalOpen(true);
        }
      } catch (switchError) {
        if (!loginAbortRef.current) {
          useAuthStore.getState().setStatus("error");
          useAuthStore
            .getState()
            .setError(resolveWalletErrorMessage(switchError));
          useAuthStore.getState().setLoginModalOpen(true);
        }
      } finally {
        walletHandlingRef.current = false;
        if (!loginAbortRef.current) {
          useAuthStore.getState().setLoginInProgress(false);
        }
      }
    },
    [clearAuthState, maybeCloseSetupModal]
  );

  const refreshReadiness = useCallback(
    async (nextSession?: TradingUserSession) => {
      const store = useAuthStore.getState();

      if (!nextSession) {
        store.setReadiness(undefined);
        return undefined;
      }

      const nextReadiness = await fetchTradingReadinessWithBalances();
      store.setReadiness(nextReadiness);
      return nextReadiness;
    },
    []
  );

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
    [refreshReadiness]
  );

  const openSetupModalIfNeeded = useCallback(() => {
    const store = useAuthStore.getState();

    if (
      shouldAutoOpenTradingSetupModal({
        session: store.session,
        readiness: store.readiness,
        isRegionBlocked: isRegionBlockedRef.current
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

      // Embedded wallets (email / google) are reconnected asynchronously by
      // Privy + PrivyWalletBridge. Trust the persisted Privy + server session
      // instead of the injected-wallet connection snapshot, so refreshes do
      // not wrongly clear the session before wagmi rehydrates.
      const embeddedLoginMethod =
        store.loginMethod === "email" || store.loginMethod === "google";

      if (embeddedLoginMethod) {
        if (nextSession.depositWalletStatus !== "deployed") {
          await ensureDepositWalletDeployed(nextSession.walletAddress, {
            onStep: (step) => store.setLoginStep(step)
          });
        }

        const nextReadiness = await refreshReadiness(nextSession);
        store.setStatus("ready");
        store.setLoginStep(undefined);
        void syncProphetWalletLogin(nextSession.walletAddress);

        if (isTradingSetupComplete(nextReadiness)) {
          store.setLoginModalOpen(false);
          store.setError(undefined);
        } else {
          openSetupModalIfNeeded();
        }

        return;
      }

      const walletSnapshot = await inspectWalletConnection(
        nextSession.walletAddress,
        {
          waitForReconnect: true
        }
      );

      if (walletSnapshot.status === "disconnected") {
        await clearAuthState({
          error: "Wallet disconnected. Connect again to continue."
        });
        return;
      }

      if (walletSnapshot.status === "reconnecting") {
        const nextReadiness = await refreshReadiness(nextSession);
        store.setStatus("ready");
        store.setLoginStep(undefined);

        if (isTradingSetupComplete(nextReadiness)) {
          store.setLoginModalOpen(false);
          store.setError(undefined);
        } else {
          openSetupModalIfNeeded();
        }

        return;
      }

      if (
        walletSnapshot.status === "account_changed" &&
        walletSnapshot.activeAccount
      ) {
        await handleWalletAccountSwitch(walletSnapshot.activeAccount);
        return;
      }

      if (nextSession.depositWalletStatus !== "deployed") {
        await ensureDepositWalletDeployed(nextSession.walletAddress, {
          onStep: (step) => store.setLoginStep(step)
        });
      }

      const nextReadiness = await refreshReadiness(nextSession);
      store.setStatus("ready");
      store.setLoginStep(undefined);
      void syncProphetWalletLogin(nextSession.walletAddress);

      if (isTradingSetupComplete(nextReadiness)) {
        store.setLoginModalOpen(false);
        store.setError(undefined);
      } else {
        openSetupModalIfNeeded();
      }
    } catch (sessionError) {
      store.setStatus("error");
      store.setError(resolveWalletErrorMessage(sessionError));
    } finally {
      store.setLoginInProgress(false);
      walletHandlingRef.current = false;
    }
  }, [
    clearAuthState,
    handleWalletAccountSwitch,
    openSetupModalIfNeeded,
    refreshReadiness
  ]);

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
      store.setCashError(resolveWalletErrorMessage(syncError));
      throw syncError;
    } finally {
      syncingRef.current = false;
    }
  }, [refreshCash]);

  const runLogin = useCallback(
    async (resume: boolean) => {
      const store = useAuthStore.getState();

      if (isRegionBlockedRef.current) {
        store.setLoginModalOpen(true);
        return undefined;
      }

      loginAbortRef.current = false;
      loginConnectAbortRef.current?.abort();
      loginConnectAbortRef.current = new AbortController();
      store.setLoginInProgress(true);
      store.setLoginModalOpen(true);
      store.setStatus("loading");
      store.setError(undefined);
      store.setLoginStep(undefined);

      if (!store.loginMethod) {
        store.setLoginMethod("wallet");
      }

      try {
        const result = await completeTradingLogin({
          resume,
          connectSignal: loginConnectAbortRef.current.signal,
          onStep: (step) => {
            if (!loginAbortRef.current) {
              useAuthStore.getState().setLoginStep(step);
            }
          }
        });

        if (loginAbortRef.current) {
          return undefined;
        }

        store.setSession(result.session);
        store.setReadiness(result.readiness);
        store.setStatus("ready");
        store.setLoginStep(undefined);
        maybeCloseSetupModal(result.readiness);
        void syncProphetWalletLogin(result.session.walletAddress);

        return result;
      } catch (loginError) {
        if (loginAbortRef.current) {
          return undefined;
        }

        store.setSession(undefined);
        store.setReadiness(undefined);
        store.setStatus("error");
        store.setError(resolveWalletErrorMessage(loginError));
        store.setLoginStep(undefined);
        privyAutoLoginRef.current = false;
        oauthAutoConnectRef.current = false;
        throw loginError;
      } finally {
        if (!loginAbortRef.current) {
          store.setLoginInProgress(false);
        }
      }
    },
    [maybeCloseSetupModal]
  );

  const startPrivyTradingLogin = useCallback(
    async (method: AuthLoginMethod) => {
      const store = useAuthStore.getState();

      if (store.session || isRegionBlockedRef.current) {
        consumeOAuthPending();
        clearOAuthUrlParams();
        return;
      }

      if (privyAutoLoginRef.current) {
        return;
      }

      store.setLoginMethod(method);
      store.setLoginModalOpen(true);

      if (!privyReady || !privyAuthenticated) {
        return;
      }

      if (store.loginInProgress) {
        return;
      }

      privyAutoLoginRef.current = true;
      oauthAutoConnectRef.current = true;
      consumeOAuthPending();
      clearOAuthUrlParams();

      try {
        if (privyWallets.length === 0 && !privyWalletCreatingRef.current) {
          privyWalletCreatingRef.current = true;

          try {
            await createWallet();
          } catch {
            // Wallet may already exist; waitForPrivyWallet handles async creation.
          } finally {
            privyWalletCreatingRef.current = false;
          }

          await waitForPrivyWallet({ timeoutMs: 15_000 });
        }

        await runLogin(false);
      } catch {
        privyAutoLoginRef.current = false;
        oauthAutoConnectRef.current = false;
      }
    },
    [
      createWallet,
      privyAuthenticated,
      privyReady,
      privyWallets.length,
      runLogin,
    ],
  );

  useEffect(() => {
    startPrivyTradingLoginRef.current = startPrivyTradingLogin;
  }, [startPrivyTradingLogin]);

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

      const setupStep: TradingSetupStepId =
        action === "clob" ? "clob" : "tokens";

      try {
        store.setLoginStep(
          action === "clob"
            ? "checking_clob_credentials"
            : "checking_token_approval"
        );

        let nextReadiness = await refreshReadiness(currentSession);

        if (isSetupStepComplete(nextReadiness, setupStep)) {
          store.setLoginStep(
            setupStep === "clob"
              ? "clob_already_derived"
              : "tokens_already_authorized"
          );
          maybeCloseSetupModal(nextReadiness);
          return;
        }

        if (action === "clob") {
          nextReadiness = await ensureClobCredentials(currentSession, {
            onStep: (step) => store.setLoginStep(step)
          });
        } else {
          nextReadiness = await ensureTokenApprovals(currentSession, {
            onStep: (step) => store.setLoginStep(step)
          });
        }

        store.setReadiness(nextReadiness);

        if (!isSetupStepComplete(nextReadiness, setupStep)) {
          nextReadiness =
            (await pollSetupReadiness(currentSession, setupStep)) ??
            nextReadiness;
        }

        maybeCloseSetupModal(nextReadiness);
      } catch (stepError) {
        store.setError(resolveWalletErrorMessage(stepError));
        throw stepError;
      } finally {
        store.setLoginInProgress(false);
        store.setLoginStep(undefined);
      }
    },
    [maybeCloseSetupModal, pollSetupReadiness, refreshReadiness]
  );

  const openLoginModalOnly = useCallback(() => {
    const store = useAuthStore.getState();
    store.setLoginModalOpen(true);
    store.setError(undefined);
  }, []);

  const openLogin = useCallback(async () => {
    const store = useAuthStore.getState();

    if (isRegionBlockedRef.current) {
      openLoginModalOnly();
      return undefined;
    }

    return runLogin(Boolean(store.session));
  }, [openLoginModalOnly, runLogin]);

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

  const openPrivyLogin = useCallback(() => {
    const store = useAuthStore.getState();
    store.setError(undefined);
    setPrivyModalOpen(true);
  }, []);

  const closePrivyLogin = useCallback(() => {
    setPrivyModalOpen(false);
  }, []);

  const setLoginMethod = useCallback((method: AuthLoginMethod | undefined) => {
    useAuthStore.getState().setLoginMethod(method);
  }, []);

  const closeLogin = useCallback(async () => {
    const store = useAuthStore.getState();

    loginAbortRef.current = true;
    loginConnectAbortRef.current?.abort();
    setPrivyModalOpen(false);

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
    wagmiDisconnect?.();
    const store = useAuthStore.getState();

    loginAbortRef.current = true;
    loginConnectAbortRef.current?.abort();
    walletHandlingRef.current = true;
    setPrivyModalOpen(false);
    privyAutoLoginRef.current = false;
    oauthAutoConnectRef.current = false;
    store.setStatus("loading");
    store.setError(undefined);
    store.setLoginInProgress(false);
    store.setLoginStep(undefined);
    store.setLoginModalOpen(false);
    store.setLoginMethod("wallet");

    try {
      await clearAuthState({ openModal: false });
      try {
        await privyLogout();
      } catch {
        // ignore privy logout errors during disconnect
      }
      store.setError(undefined);
    } catch (disconnectError) {
      store.setStatus("error");
      store.setError(resolveWalletErrorMessage(disconnectError));
      throw disconnectError;
    } finally {
      walletHandlingRef.current = false;
    }
  }, [clearAuthState, privyLogout, wagmiDisconnect]);

  useEffect(() => {
    if (!hydrated || !session?.walletAddress) {
      return;
    }

    // Embedded wallets (email / google) are managed by Privy and do not emit
    // injected-provider disconnect/account-change events, so skip the watcher
    // to avoid false "disconnected" detection.
    if (loginMethod === "email" || loginMethod === "google") {
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
      }
    });
  }, [
    handleWalletAccountSwitch,
    handleWalletDisconnected,
    hydrated,
    loginMethod,
    session?.walletAddress
  ]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void refreshEligibility();

    const intervalId = window.setInterval(() => {
      void refreshEligibility();
    }, ELIGIBILITY_REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshEligibility();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hydrated, refreshEligibility]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const oauthReturnProvider = getOAuthReturnProvider();
    const oauthPending = window.localStorage.getItem(OAUTH_PENDING_STORAGE_KEY);

    if (
      oauthReturnProvider === "google" ||
      oauthPending === "google" ||
      hasOAuthReturnParams()
    ) {
      const store = useAuthStore.getState();
      store.setLoginMethod("google");
      store.setLoginModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void refreshSession();
  }, [hydrated, refreshSession]);

  useEffect(() => {
    if (!hydrated || !privyReady || !privyAuthenticated) {
      return;
    }

    const store = useAuthStore.getState();

    if (store.session) {
      if (!privyAutoLoginRef.current) {
        privyAutoLoginRef.current = true;
        oauthAutoConnectRef.current = true;
      }

      consumeOAuthPending();
      clearOAuthUrlParams();
      return;
    }

    if (privyAutoLoginRef.current || store.loginInProgress) {
      return;
    }

    if (isRegionBlockedRef.current) {
      consumeOAuthPending();
      clearOAuthUrlParams();
      return;
    }

    const oauthPending = window.localStorage.getItem(OAUTH_PENDING_STORAGE_KEY);
    const oauthReturnProvider = getOAuthReturnProvider();
    const shouldAutoLogin =
      Boolean(oauthPending) ||
      oauthReturnProvider === "google" ||
      store.loginMethod === "email" ||
      store.loginMethod === "google";

    if (!shouldAutoLogin) {
      return;
    }

    const method: AuthLoginMethod =
      oauthPending === "google" ||
      oauthReturnProvider === "google" ||
      store.loginMethod === "google"
        ? "google"
        : "email";

    void startPrivyTradingLogin(method);
  }, [
    hydrated,
    loginInProgress,
    loginMethod,
    privyAuthenticated,
    privyReady,
    privyWallets.length,
    startPrivyTradingLogin,
  ]);

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
    eligibilityView,
    eligibilityLoadStatus,
    isRegionBlocked,
    loginMethod,
    privyModalOpen,
    privyReady,
    openLoginModalOnly,
    openPrivyLogin,
    closePrivyLogin,
    setLoginMethod,
    refreshEligibility,
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
    syncCash
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal auth={value} />
    </AuthContext.Provider>
  );
}
