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
  clearStoredWalletConnectors,
  disconnectTradingSession,
  loadTradingSession
} from "@/components/trading/trading-wallet-session";
import {
  AuthContext,
  type AuthContextValue,
  type EligibilityLoadStatus
} from "@/context/auth/auth-context";
import {
  authenticateConfidential,
  clearConfidentialSession,
  getConfidentialBalances,
  getConfidentialSession,
  requestConfidentialChallenge,
} from "@/lib/confidential/client";
import { mapBalanceSnapshotToCash } from "@/lib/trading/cash-balance-model";
import { mergeTradingReadiness } from "@/lib/trading/merge-trading-readiness";
import {
  fetchTradingBalances,
  fetchTradingReadinessWithBalances,
} from "@/lib/trading/trading-login";
import { fetchTradingReadinessWithOnchain, enrichSetupReadinessWithOnchain } from "@/lib/trading/trading-balances-client";
import {
  completeTradingLogin,
  ensureClobCredentials,
  ensureDepositWalletDeployed,
  ensureTokenApprovals
} from "@/lib/trading/trading-login";
import { postCollateralBalanceSync } from "@/lib/trading/sync-collateral-balance";
import {
  ensureTradingWalletReconnected,
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
import {
  isTradingEligibilityRestricted,
  showRegionRestrictionToast,
} from "@/lib/trading/region-restriction-toast";
import {
  fetchTradingEligibility,
  isBuyRestricted as checkIsBuyRestricted,
  isRegionBlocked as checkIsRegionBlocked,
  isRegionCloseOnly as checkIsRegionCloseOnly,
  type TradingEligibilityView
} from "@/lib/trading/trading-eligibility-client";
import { resolveWalletErrorMessage } from "@/lib/trading/wallet-error-message";
import { releaseExternalWalletConnection } from "@/lib/trading/wallet-disconnect";
import { useTracksStore } from "@/store/tracks-store";
import { useNotificationWsStore } from "@/store/notification-ws-store";
import { logoutProphet } from "@/service/prophet";
import { selectIsAuthenticated, useAuthStore } from "@/store/auth-store";
import type { AuthLoginMethod } from "@/store/auth-store";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import type { TradingUserSession, UserTradingReadiness } from "@/types/market";
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
import {
  isPrivyEmbeddedWallet,
  resumePrivyWalletSync,
  suspendPrivyWalletSync,
  waitForPrivyWallet,
} from "@/context/privy/privy-wallet-bridge";
import { useDisconnect } from "wagmi";
import { signConfidentialMessage } from "@/lib/confidential/sign-message";
import { useConfidentialAccount } from "@/hooks/confidential/use-confidential-account";
import { usePendingFunderUsdc } from "@/hooks/funding";

const ELIGIBILITY_REFRESH_INTERVAL_MS = 1000 * 60 * 5;

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    ready: privyReady,
    authenticated: privyAuthenticated,
    logout: privyLogout,
    createWallet
  } = usePrivy();
  const { disconnectAsync: wagmiDisconnect } = useDisconnect();
  const { wallets: privyWallets } = useWallets();
  const hydrated = useAuthHydrated();
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const readiness = useAuthStore((state) => state.readiness);
  const status = useAuthStore((state) => state.status);
  const loginStep = useAuthStore((state) => state.loginStep);
  const loginModalOpen = useAuthStore((state) => state.loginModalOpen);
  const loginInProgress = useAuthStore((state) => state.loginInProgress);
  const privyLoginInProgress = useAuthStore(
    (state) => state.privyLoginInProgress
  );
  const cash = useAuthStore((state) => state.cash);
  const cashStatus = useAuthStore((state) => state.cashStatus);
  const privateBalance = useAuthStore((state) => state.privateBalance);
  const privateBalanceStatus = useAuthStore((state) => state.privateBalanceStatus);
  const privateBalanceError = useAuthStore((state) => state.privateBalanceError);
  const error = useAuthStore((state) => state.error);
  const cashError = useAuthStore((state) => state.cashError);
  const loginMethod = useAuthStore((state) => state.loginMethod);
  const [privyModalOpen, setPrivyModalOpen] = useState(false);
  const oauthAutoConnectRef = useRef(false);
  const privyAutoLoginRef = useRef(false);
  const privyWalletCreatingRef = useRef(false);
  const pendingPrivyLoginMethodRef = useRef<AuthLoginMethod | undefined>(
    undefined
  );
  const confidentialAccount = useConfidentialAccount();
  const confirmPendingDeposit = usePendingFunderUsdc({
    enabled: Boolean(session?.funderAddress && session.depositWalletStatus === "deployed"),
  });

  useLoginWithOAuth({
    onComplete: (params) => {
      if (!params.loginAccount || params.loginMethod !== "google") {
        return;
      }
      void startPrivyTradingLogin("google");
    },
    onError: () => {
      consumeOAuthPending();
      clearOAuthUrlParams();
      privyAutoLoginRef.current = false;
      oauthAutoConnectRef.current = false;
    }
  });
  const [isRegionBlocked, setIsRegionBlocked] = useState(false);
  const [isBuyRestricted, setIsBuyRestricted] = useState(false);
  const [isRegionCloseOnly, setIsRegionCloseOnly] = useState(false);
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
  const privateBalanceRefreshingRef = useRef(false);
  const loginAbortRef = useRef(false);
  const loginConnectAbortRef = useRef<AbortController | undefined>(undefined);
  const walletHandlingRef = useRef(false);
  const eligibilityRefreshRef = useRef(false);
  const isRegionBlockedRef = useRef(false);
  const isBuyRestrictedRef = useRef(false);
  const isRegionCloseOnlyRef = useRef(false);
  const eligibilityViewRef = useRef<TradingEligibilityView | undefined>(
    undefined
  );
  const regionRestrictionToastShownRef = useRef(false);

  const syncEligibilityFlags = useCallback(
    (eligibility: TradingEligibilityView | undefined) => {
      const status = eligibility?.status;
      const fullyBlocked = checkIsRegionBlocked(status);
      const buyRestricted = checkIsBuyRestricted(status);
      const closeOnly = checkIsRegionCloseOnly(status);

      setIsRegionBlocked(fullyBlocked);
      setIsBuyRestricted(buyRestricted);
      setIsRegionCloseOnly(closeOnly);
      isRegionBlockedRef.current = fullyBlocked;
      isBuyRestrictedRef.current = buyRestricted;
      isRegionCloseOnlyRef.current = closeOnly;
    },
    []
  );

  useEffect(() => {
    isRegionBlockedRef.current = isRegionBlocked;
  }, [isRegionBlocked]);

  useEffect(() => {
    isBuyRestrictedRef.current = isBuyRestricted;
  }, [isBuyRestricted]);

  useEffect(() => {
    isRegionCloseOnlyRef.current = isRegionCloseOnly;
  }, [isRegionCloseOnly]);

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
      syncEligibilityFlags(eligibility);
      setEligibilityLoadStatus("ready");
      return eligibility;
    } catch (refreshError) {
      setEligibilityLoadStatus("ready");
      console.warn("[auth.eligibility] refresh failed", refreshError);
      return eligibilityViewRef.current;
    } finally {
      eligibilityRefreshRef.current = false;
    }
  }, [syncEligibilityFlags]);

  const clearAuthState = useCallback(
    async (options?: { error?: string; openModal?: boolean }) => {
      const store = useAuthStore.getState();

      try {
        await disconnectTradingSession();
      } catch {
        // ignore disconnect errors during cleanup
      }

      try {
        await clearConfidentialSession();
      } catch {
        // ignore confidential session clear errors during cleanup
      }

      try {
        await releaseExternalWalletConnection();
      } catch {
        // ignore external wallet disconnect errors during cleanup
      }

      try {
        await disconnectWagmiWallet();
      } catch {
        // ignore wagmi disconnect errors during cleanup
      }

      clearStoredWalletConnectors();

      logoutProphet();
      useTracksStore.getState().reset();
      useNotificationWsStore.getState().reset();

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
      const setup = store.readiness
        ? await enrichSetupReadinessWithOnchain(store.readiness)
        : await fetchTradingReadinessWithOnchain();
      const nextReadiness = mergeTradingReadiness(setup, balances);
      store.setReadiness(nextReadiness);
      store.setCash(
        balances.balances
          ? mapBalanceSnapshotToCash(balances.balances)
          : undefined
      );
      store.setCashStatus("ready");
    } catch (refreshError) {
      store.setCashStatus("error");
      store.setCashError(resolveWalletErrorMessage(refreshError));
    }
  }, []);

  const refreshPrivateBalance = useCallback(async (params?: { requiredSession?: boolean; }) => {
    const { requiredSession = true } = params ?? {};

    const store = useAuthStore.getState();
    const currentSession = store.session;

    if (!currentSession && requiredSession) {
      store.clearPrivateBalance();
      return;
    }

    if (privateBalanceRefreshingRef.current) {
      return;
    }

    privateBalanceRefreshingRef.current = true;
    store.setPrivateBalanceStatus("loading");
    store.setPrivateBalanceError(undefined);

    try {
      const payload = await getConfidentialBalances();
      store.setPrivateBalance(payload.usdc);
      store.setPrivateBalanceStatus("ready");
    } catch (refreshError) {
      store.setPrivateBalanceStatus("error");
      store.setPrivateBalanceError(resolveWalletErrorMessage(refreshError));
    } finally {
      privateBalanceRefreshingRef.current = false;
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

    walletHandlingRef.current = true;

    try {
      const nextSession = await loadTradingSession();

      if (!nextSession) {
        store.clearAuth();
        store.setLoginInProgress(false);
        store.setStatus("ready");
        openSetupModalIfNeeded();

        walletHandlingRef.current = false;
        return;
      }

      store.setLoginInProgress(true);
      store.setStatus("loading");
      store.setError(undefined);
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

        if (isTradingSetupComplete(nextReadiness)) {
          store.setLoginModalOpen(false);
          store.setError(undefined);
        } else {
          openSetupModalIfNeeded();
        }

        return;
      }

      await ensureTradingWalletReconnected(nextSession.walletAddress);

      const walletSnapshot = await inspectWalletConnection(
        nextSession.walletAddress,
        {
          waitForReconnect: true
        }
      );

      if (walletSnapshot.status === "disconnected") {
        if (privyAuthenticated) {
          const nextReadiness = await refreshReadiness(nextSession);
          store.setStatus("ready");
          store.setLoginStep(undefined);
          store.setError(
            "Wallet extension is not connected. Reconnect your wallet to continue."
          );
          openSetupModalIfNeeded();

          if (isTradingSetupComplete(nextReadiness)) {
            store.setLoginModalOpen(true);
          }

          return;
        }

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
    privyAuthenticated,
    privyReady,
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
    async (resume: boolean, method?: AuthLoginMethod) => {
      const store = useAuthStore.getState();
      const _loginMethod = method ?? store.loginMethod;

      if (isRegionBlockedRef.current) {
        store.setLoginModalOpen(true);
        store.setPrivyLoginInProgress(false);
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
      if (_loginMethod === "email" || _loginMethod === "google") {
        store.setPrivyLoginInProgress(true);
      }

      if (!_loginMethod) {
        store.setLoginMethod("wallet");
        store.setPrivyLoginInProgress(false);
      }

      try {
        const result = await completeTradingLogin({
          resume,
          connectSignal: loginConnectAbortRef.current.signal,
          onStep: (step) => {
            if (!loginAbortRef.current) {
              store.setLoginStep(step);
            }
          }
        });

        if (loginAbortRef.current) {
          store.setPrivyLoginInProgress(false);
          return undefined;
        }

        store.setSession(result.session);
        store.setReadiness(result.readiness);
        store.setStatus("ready");
        store.setLoginStep(undefined);
        maybeCloseSetupModal(result.readiness);
        store.setPrivyLoginInProgress(false);

        return result;
      } catch (loginError) {
        if (loginAbortRef.current) {
          store.setPrivyLoginInProgress(false);
          return undefined;
        }

        store.setSession(undefined);
        store.setReadiness(undefined);
        store.setStatus("error");
        store.setError(resolveWalletErrorMessage(loginError));
        store.setLoginStep(undefined);
        privyAutoLoginRef.current = false;
        oauthAutoConnectRef.current = false;
        store.setPrivyLoginInProgress(false);
        throw loginError;
      } finally {
        if (!loginAbortRef.current) {
          store.setLoginInProgress(false);
          store.setPrivyLoginInProgress(false);
        }
      }
    },
    [maybeCloseSetupModal]
  );

  const startPrivyTradingLogin = useCallback(
    async (method: AuthLoginMethod) => {
      const store = useAuthStore.getState();
      store.setPrivyLoginInProgress(true);

      if (store.session || isRegionBlockedRef.current) {
        consumeOAuthPending();
        clearOAuthUrlParams();
        store.setPrivyLoginInProgress(false);
        return;
      }

      if (privyAutoLoginRef.current) {
        store.setPrivyLoginInProgress(false);
        return;
      }

      store.setLoginMethod(method);
      store.setLoginModalOpen(true);
      pendingPrivyLoginMethodRef.current = method;

      if (!privyReady) {
        store.setPrivyLoginInProgress(false);
        return;
      }

      if (store.loginInProgress) {
        store.setPrivyLoginInProgress(false);
        return;
      }

      pendingPrivyLoginMethodRef.current = undefined;
      privyAutoLoginRef.current = true;
      oauthAutoConnectRef.current = true;
      consumeOAuthPending();
      clearOAuthUrlParams();

      try {
        await releaseExternalWalletConnection();

        const hasEmbeddedWallet = privyWallets.some(isPrivyEmbeddedWallet);

        if (!hasEmbeddedWallet && !privyWalletCreatingRef.current) {
          privyWalletCreatingRef.current = true;

          try {
            await createWallet();
          } catch {
            // Wallet may already exist; waitForPrivyWallet handles async creation.
          } finally {
            privyWalletCreatingRef.current = false;
          }

          await waitForPrivyWallet({ timeoutMs: 15_000, preferEmbedded: true });
        }

        await runLogin(false, method);
        pendingPrivyLoginMethodRef.current = undefined;
      } catch (loginError) {
        privyAutoLoginRef.current = false;
        oauthAutoConnectRef.current = false;
        pendingPrivyLoginMethodRef.current = method;

        const activeStore = useAuthStore.getState();
        activeStore.setError(resolveWalletErrorMessage(loginError));
        activeStore.setLoginModalOpen(true);
        store.setPrivyLoginInProgress(false);
      }
    },
    [
      createWallet,
      privyAuthenticated,
      privyReady,
      privyWallets.length,
      runLogin
    ]
  );

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

    try {
      await wagmiDisconnect();
    } catch { }
    store.setLoginMethod("wallet");

    if (isRegionBlockedRef.current) {
      openLoginModalOnly();
      return undefined;
    }

    return runLogin(Boolean(store.session), "wallet");
  }, [openLoginModalOnly, runLogin, wagmiDisconnect]);

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

  const openPrivyLogin = useCallback(async () => {
    const store = useAuthStore.getState();
    store.setError(undefined);
    try {
      await wagmiDisconnect();
    } catch { }
    setPrivyModalOpen(true);
  }, [wagmiDisconnect]);

  const closePrivyLogin = useCallback(() => {
    setPrivyModalOpen(false);
  }, []);

  const completePrivyEmailLogin = useCallback(() => {
    const store = useAuthStore.getState();
    store.setLoginMethod("email");
    store.setLoginModalOpen(true);
    setPrivyModalOpen(false);
    pendingPrivyLoginMethodRef.current = "email";
    void startPrivyTradingLogin("email");
  }, [startPrivyTradingLogin]);

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
    const store = useAuthStore.getState();

    suspendPrivyWalletSync();
    loginAbortRef.current = true;
    loginConnectAbortRef.current?.abort();
    walletHandlingRef.current = true;
    setPrivyModalOpen(false);
    privyAutoLoginRef.current = false;
    oauthAutoConnectRef.current = false;
    pendingPrivyLoginMethodRef.current = undefined;
    store.setStatus("loading");
    store.setError(undefined);
    store.setLoginInProgress(false);
    store.setLoginStep(undefined);
    store.setLoginModalOpen(false);
    store.setLoginMethod(undefined);

    try {
      // Log out Privy first so PrivyWalletBridge stops re-binding wagmi.
      try {
        await privyLogout();
      } catch {
        // ignore privy logout errors during disconnect
      }
      try {
        await wagmiDisconnect();
      } catch { }

      await clearAuthState({ openModal: false });

      // clearAuthState disconnects wagmi; repeat after Privy logout to clear
      // any stale connector state persisted in wagmi cookie storage.
      await disconnectWagmiWallet();
      store.setError(undefined);
    } catch (disconnectError) {
      store.setStatus("error");
      store.setError(resolveWalletErrorMessage(disconnectError));
      throw disconnectError;
    } finally {
      resumePrivyWalletSync();
      walletHandlingRef.current = false;
    }
  }, [clearAuthState, privyLogout, wagmiDisconnect]);

  const onAuthenticateConfidential = async () => {
    if (!session) {
      throw new Error("No session found");
    }

    try {
      const confidentialSession = await getConfidentialSession();

      if (
        confidentialSession.authenticated &&
        confidentialSession.eoaAddress?.toLowerCase() === session.walletAddress.toLowerCase()
      ) {
        return confidentialSession;
      }

      const challenge = await requestConfidentialChallenge(session.walletAddress);
      const signature = await signConfidentialMessage(session.walletAddress, challenge.message);
      const authenticateConfidentialRes = await authenticateConfidential({
        eoaAddress: session.walletAddress,
        message: challenge.message,
        signature,
      });
      return {
        authenticated: true,
        eoaAddress: session.walletAddress,
        intentsUserId: authenticateConfidentialRes.intentsUserId,
      };
    } catch (error) {
      throw error;
    }
  };

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
      isPaused: () => walletHandlingRef.current || !privyReady,
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
    privyReady,
    session?.walletAddress
  ]);

  useEffect(() => {
    if (
      !hydrated ||
      eligibilityLoadStatus !== "ready" ||
      regionRestrictionToastShownRef.current ||
      !eligibilityView
    ) {
      return;
    }

    if (!isTradingEligibilityRestricted(eligibilityView)) {
      return;
    }

    regionRestrictionToastShownRef.current = true;
    showRegionRestrictionToast(eligibilityView);
  }, [eligibilityLoadStatus, eligibilityView, hydrated]);

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
    if (!hydrated || !privyReady) {
      return;
    }

    void refreshSession();
  }, [hydrated, privyReady, privyAuthenticated, refreshSession]);

  useEffect(() => {
    // if (!hydrated || !privyReady || !privyAuthenticated) {
    //   return;
    // }
    // const store = useAuthStore.getState();
    // if (store.session) {
    //   if (!privyAutoLoginRef.current) {
    //     privyAutoLoginRef.current = true;
    //     oauthAutoConnectRef.current = true;
    //   }
    //   consumeOAuthPending();
    //   clearOAuthUrlParams();
    //   return;
    // }
    // if (privyAutoLoginRef.current || store.loginInProgress) {
    //   return;
    // }
    // if (isRegionBlockedRef.current) {
    //   consumeOAuthPending();
    //   clearOAuthUrlParams();
    //   return;
    // }
    // const oauthPending = window.localStorage.getItem(OAUTH_PENDING_STORAGE_KEY);
    // const oauthReturnProvider = getOAuthReturnProvider();
    // const pendingMethod = pendingPrivyLoginMethodRef.current;
    // const shouldAutoLogin =
    //   Boolean(pendingMethod) ||
    //   Boolean(oauthPending) ||
    //   oauthReturnProvider === "google" ||
    //   store.loginMethod === "email" ||
    //   store.loginMethod === "google";
    // if (!shouldAutoLogin) {
    //   return;
    // }
    // const method: AuthLoginMethod =
    //   pendingMethod ??
    //   (oauthPending === "google" ||
    //     oauthReturnProvider === "google" ||
    //     store.loginMethod === "google"
    //     ? "google"
    //     : "email");
    // debugger
    // void startPrivyTradingLogin(method);
  }, [
    hydrated,
    loginInProgress,
    loginMethod,
    privyAuthenticated,
    privyReady,
    privyWallets.length,
    startPrivyTradingLogin
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
      void refreshPrivateBalance();
    }
  }, [session, setupSteps.clobSigned, status, refreshCash, refreshPrivateBalance]);
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
    privyLoginInProgress,
    cash,
    cashStatus,
    privateBalance,
    privateBalanceStatus,
    privateBalanceError,
    error,
    cashError,
    eligibilityView,
    eligibilityLoadStatus,
    isRegionBlocked,
    isBuyRestricted,
    isRegionCloseOnly,
    loginMethod,
    privyModalOpen,
    privyReady,
    openLoginModalOnly,
    openPrivyLogin,
    closePrivyLogin,
    completePrivyEmailLogin,
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
    refreshPrivateBalance,
    onAuthenticateConfidential,
    confidentialAccount,
    confirmPendingDeposit,
    syncCash
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal auth={value} />
    </AuthContext.Provider>
  );
}
