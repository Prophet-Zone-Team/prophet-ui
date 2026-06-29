"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useAuth } from "@/context/auth/use-auth";
import {
  createCopyTradeWalletSigned,
  fetchCopyTradeWallet,
  isCopyWalletPending,
  isCopyWalletReady,
  loadCopyTradeUser,
  loginCopyTradeWalletSession,
  normalizeCopyTradeWalletAddress,
  pollCopyTradeWalletReady,
  resolveCopyWalletStatusLabel,
  verifyCopyTradeSessionCookie,
} from "@/lib/copy-trade/auth";
import { CopyTradeApiError } from "@/service/copy-trade/client";
import { getActiveEvmAccount } from "@/lib/wallet/evm/signer-source";
import { useAuthHydrated } from "@/store/use-auth-hydrated";
import { useAuthStore } from "@/store/auth-store";
import {
  isCopyTradeSessionExpired,
  selectCopyTradeSession,
  useCopyTradeStore,
  useCopyTradeStoredSession,
} from "@/store/copy-trade-store";
import { useCopyTradeHydrated } from "@/store/use-copy-trade-hydrated";
import type {
  CopyTradeStoredSession,
  CopyWallet,
} from "@/types/copy-trade-api";
import { useAccount } from "wagmi";

function resolveCopyTradeWalletAddress(input: {
  stored: CopyTradeStoredSession | null;
  prophetWalletAddress?: string;
  wagmiWalletAddress?: string;
}): string {
  const candidates = [
    input.stored?.walletAddress,
    input.stored?.user?.WebWalletAddress,
    input.prophetWalletAddress,
    input.wagmiWalletAddress,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCopyTradeWalletAddress(candidate ?? "");
    if (normalized) {
      return normalized;
    }
  }

  const activeEvmAccount = getActiveEvmAccount();
  if (activeEvmAccount.connected && activeEvmAccount.address) {
    return normalizeCopyTradeWalletAddress(activeEvmAccount.address);
  }

  return "";
}

async function buildCopyTradeSession(
  walletAddress: string,
  email = "",
): Promise<CopyTradeStoredSession> {
  const account = normalizeCopyTradeWalletAddress(walletAddress);
  const walletSession = await loginCopyTradeWalletSession(account);
  const loadedUser = await loadCopyTradeUser(account, email);
  const { CopyWallet: embeddedWallet, ...user } = loadedUser;

  let copyWallet = embeddedWallet ?? null;
  if (!copyWallet) {
    copyWallet = await fetchCopyTradeWallet(user.ID);
  }

  return {
    walletAddress: account,
    user,
    copyWallet,
    expiresAt: walletSession.expires_at,
  };
}

export function useCopyTradeTest() {
  const t = useTranslations("copyTrade.toast");
  const authHydrated = useAuthHydrated();
  const copyTradeHydrated = useCopyTradeHydrated();
  const { address: wagmiAddress } = useAccount();
  const prophetSession = useAuthStore((state) => state.session);
  const loginEmail = useAuthStore((state) => state.loginEmail);
  const copyTradeSession = useCopyTradeStoredSession();
  const setSession = useCopyTradeStore((state) => state.setSession);
  const updateCopyWallet = useCopyTradeStore((state) => state.updateCopyWallet);
  const clearSession = useCopyTradeStore((state) => state.clearSession);
  const { openLogin } = useAuth();
  const [busyLogin, setBusyLogin] = useState(false);
  const [busyDeploy, setBusyDeploy] = useState(false);
  const [busyRefresh, setBusyRefresh] = useState(false);
  const [busyPoll, setBusyPoll] = useState(false);
  const restoreAttemptedRef = useRef(false);

  const hydrated = authHydrated && copyTradeHydrated;
  const walletAddress = prophetSession?.walletAddress;
  const copyWallet = copyTradeSession?.copyWallet ?? null;
  const isCopyTradeLoggedIn = Boolean(copyTradeSession?.user?.ID);
  const isWalletReady = isCopyWalletReady(copyWallet);
  const isWalletPending = isCopyWalletPending(copyWallet);
  const isDeployed = copyWallet?.WalletStatus?.toLowerCase() === "deployed";
  const walletStatusLabel = resolveCopyWalletStatusLabel(copyWallet);
  const displayUserId = copyTradeSession?.user?.ID ?? copyWallet?.UserID;
  const displayWalletAddress = copyTradeSession?.walletAddress ?? walletAddress;

  const applySession = useCallback(
    (next: CopyTradeStoredSession | null) => {
      if (next) {
        setSession(next);
        return;
      }
      clearSession();
    },
    [clearSession, setSession],
  );

  useEffect(() => {
    if (!authHydrated) {
      return;
    }

    const prophetWallet = prophetSession?.walletAddress;

    if (!prophetWallet) {
      clearSession();
      return;
    }

    const stored = selectCopyTradeSession(useCopyTradeStore.getState());
    if (
      stored &&
      normalizeCopyTradeWalletAddress(stored.walletAddress) !==
        normalizeCopyTradeWalletAddress(prophetWallet)
    ) {
      clearSession();
    }
  }, [authHydrated, clearSession, prophetSession?.walletAddress]);

  useEffect(() => {
    if (!hydrated || restoreAttemptedRef.current) {
      return;
    }

    const stored = selectCopyTradeSession(useCopyTradeStore.getState());
    if (!stored?.user?.ID) {
      restoreAttemptedRef.current = true;
      return;
    }

    if (isCopyTradeSessionExpired(stored.expiresAt)) {
      clearSession();
      restoreAttemptedRef.current = true;
      return;
    }

    restoreAttemptedRef.current = true;

    void verifyCopyTradeSessionCookie(stored.user.ID).then((valid) => {
      if (!valid) {
        clearSession();
      }
    });
  }, [clearSession, hydrated]);

  const resolveWalletAddress = useCallback(async (): Promise<string> => {
    const resolved = resolveCopyTradeWalletAddress({
      stored: copyTradeSession,
      prophetWalletAddress: prophetSession?.walletAddress,
      wagmiWalletAddress: wagmiAddress,
    });

    if (resolved) {
      return resolved;
    }

    const result = await openLogin();
    const nextAddress = result?.session.walletAddress?.trim();

    if (!nextAddress) {
      throw new Error(t("connectWalletToContinue"));
    }

    return normalizeCopyTradeWalletAddress(nextAddress);
  }, [
    copyTradeSession,
    openLogin,
    prophetSession?.walletAddress,
    t,
    wagmiAddress,
  ]);

  const loginCopyTrade = useCallback(async () => {
    setBusyLogin(true);
    try {
      const account = await resolveWalletAddress();
      const email = loginEmail?.trim() ?? "";
      const next = await buildCopyTradeSession(account, email);
      applySession(next);
      toast.success(t("signedIn"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("unableToSignIn"),
      );
    } finally {
      setBusyLogin(false);
    }
  }, [applySession, loginEmail, resolveWalletAddress, t]);

  const refreshCopyTradeSession = useCallback(async () => {
    const current = copyTradeSession;
    if (!current?.user?.ID) {
      return;
    }

    setBusyRefresh(true);
    try {
      const wallet = await fetchCopyTradeWallet(current.user.ID);
      if (wallet) {
        updateCopyWallet(wallet);
        return;
      }

      updateCopyWallet(null);
    } catch (error) {
      if (error instanceof CopyTradeApiError && error.status === 401) {
        await loginCopyTrade();
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : t("unableToRefreshSession"),
      );
    } finally {
      setBusyRefresh(false);
    }
  }, [copyTradeSession, loginCopyTrade, t, updateCopyWallet]);

  const deployCopyWallet = useCallback(async (): Promise<boolean> => {
    const current = copyTradeSession;

    if (!current?.user?.ID) {
      toast.error(t("signInFirst"));
      return false;
    }

    setBusyDeploy(true);
    try {
      const account =
        current.walletAddress ||
        current.user.WebWalletAddress ||
        (await resolveWalletAddress());
      const wallet = await createCopyTradeWalletSigned(
        account,
        current.user.ID,
      );
      const next: CopyTradeStoredSession = {
        ...current,
        walletAddress: normalizeCopyTradeWalletAddress(account),
        copyWallet: wallet,
      };
      applySession(next);

      if (isCopyWalletReady(wallet)) {
        toast.success(t("copyWalletReady"));
      } else if (isCopyWalletPending(wallet)) {
        toast.success(t("deploymentInProgress"));
      } else {
        toast.success(t("deploymentStarted"));
      }

      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("unableToDeploy"),
      );
      return false;
    } finally {
      setBusyDeploy(false);
    }
  }, [applySession, copyTradeSession, resolveWalletAddress, t]);

  const pollCopyWalletReadyState = useCallback(async () => {
    const userId = copyTradeSession?.user?.ID;
    if (!userId) {
      return null;
    }

    setBusyPoll(true);
    try {
      const wallet = await pollCopyTradeWalletReady(userId, {
        onUpdate: (nextWallet) => {
          updateCopyWallet(nextWallet);
        },
      });

      if (wallet) {
        updateCopyWallet(wallet);
      }

      return wallet;
    } finally {
      setBusyPoll(false);
    }
  }, [copyTradeSession?.user?.ID, updateCopyWallet]);

  return useMemo(
    () => ({
      hydrated,
      walletAddress,
      copyTradeSession,
      isCopyTradeLoggedIn,
      copyWallet,
      isDeployed,
      isWalletReady,
      isWalletPending,
      walletStatusLabel,
      displayUserId,
      displayWalletAddress,
      busyLogin,
      busyDeploy,
      busyRefresh,
      busyPoll,
      loginCopyTrade,
      deployCopyWallet,
      refreshCopyTradeSession,
      pollCopyWalletReady: pollCopyWalletReadyState,
    }),
    [
      busyDeploy,
      busyLogin,
      busyPoll,
      busyRefresh,
      copyTradeSession,
      copyWallet,
      deployCopyWallet,
      displayUserId,
      displayWalletAddress,
      hydrated,
      isCopyTradeLoggedIn,
      isDeployed,
      isWalletPending,
      isWalletReady,
      loginCopyTrade,
      pollCopyWalletReadyState,
      refreshCopyTradeSession,
      walletAddress,
      walletStatusLabel,
    ],
  );
}
