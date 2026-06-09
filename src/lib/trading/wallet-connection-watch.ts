"use client";

import { getAccount, reconnect, watchAccount } from "wagmi/actions";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import {
  activatePrivyWallet,
  waitForPrivySessionReady,
} from "@/context/privy/privy-wallet-bridge";

import {
  getPrimaryAuthorizedWalletAccount,
  isWalletAddressAuthorized
} from "@/components/trading/wallet-provider";

export type WalletConnectionStatus =
  | "matched"
  | "disconnected"
  | "account_changed"
  | "reconnecting";

export interface WalletConnectionSnapshot {
  accounts: string[];
  status: WalletConnectionStatus;
  activeAccount?: string;
}

const DEBOUNCE_MS = 300;
const WALLET_RECONNECT_TIMEOUT_MS = 10_000;
const SESSION_RECONNECT_TIMEOUT_MS = 20_000;

/**
 * Restores wagmi's active connector after refresh for extension / external wallets
 * linked through Privy. Must run after Privy has finished booting.
 */
export async function ensureTradingWalletReconnected(
  expectedAddress: string,
  options?: { timeoutMs?: number },
) {
  if (typeof window === "undefined") {
    return;
  }

  const timeoutMs = options?.timeoutMs ?? SESSION_RECONNECT_TIMEOUT_MS;

  await waitForPrivySessionReady({ timeoutMs });

  try {
    await reconnect(wagmiConfig);
  } catch {
    // wagmi may have nothing to reconnect yet; Privy activation handles that case.
  }

  await activatePrivyWallet(expectedAddress);
  await waitForWalletReady({ timeoutMs });
}

function isWalletSettling() {
  const status = getAccount(wagmiConfig).status;

  return status === "connecting" || status === "reconnecting";
}

function isWalletSettled() {
  const status = getAccount(wagmiConfig).status;

  return status === "connected" || status === "disconnected";
}

export async function waitForWalletReady(options?: {
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (isWalletSettled()) {
    return;
  }

  const timeoutMs = options?.timeoutMs ?? WALLET_RECONNECT_TIMEOUT_MS;

  await new Promise<void>((resolve) => {
    let settled = false;
    let timeoutId: number | undefined;
    let unwatch: (() => void) | undefined;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      unwatch?.();
      options?.signal?.removeEventListener("abort", onAbort);
      resolve();
    };

    const onAbort = () => {
      finish();
    };

    if (options?.signal) {
      options.signal.addEventListener("abort", onAbort);
    }

    timeoutId = window.setTimeout(finish, timeoutMs);

    unwatch = watchAccount(wagmiConfig, {
      onChange() {
        if (isWalletSettled()) {
          finish();
        }
      }
    });

    if (isWalletSettled()) {
      finish();
    }
  });
}

export async function inspectWalletConnection(
  expectedAddress?: string,
  options?: {
    waitForReconnect?: boolean;
  }
): Promise<WalletConnectionSnapshot> {
  if (options?.waitForReconnect) {
    await waitForWalletReady();
  }

  const account = getAccount(wagmiConfig);
  const connectedAddress = account.isConnected ? account.address : undefined;
  const accounts = connectedAddress ? [connectedAddress.toLowerCase()] : [];

  if (!expectedAddress) {
    return {
      accounts,
      status: "matched",
      activeAccount: connectedAddress
    };
  }

  if (isWalletSettling()) {
    return {
      accounts,
      status: "reconnecting"
    };
  }

  if (!connectedAddress) {
    return {
      accounts,
      status: "disconnected"
    };
  }

  if (isWalletAddressAuthorized(expectedAddress, accounts)) {
    return {
      accounts,
      status: "matched",
      activeAccount: connectedAddress
    };
  }

  return {
    accounts,
    status: "account_changed",
    activeAccount:
      getPrimaryAuthorizedWalletAccount(accounts) ?? connectedAddress
  };
}

interface SubscribeWalletConnectionOptions {
  expectedAddress?: string;
  isPaused?: () => boolean;
  onDisconnected: () => void;
  onAccountChanged: (nextAddress: string) => void;
}

export function subscribeWalletConnection(
  options: SubscribeWalletConnectionOptions
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  let disposed = false;
  let debounceTimer: number | undefined;
  let handling = false;

  const scheduleInspection = () => {
    if (disposed) {
      return;
    }

    if (debounceTimer !== undefined) {
      window.clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(() => {
      debounceTimer = undefined;
      void runInspection();
    }, DEBOUNCE_MS);
  };

  const runInspection = async () => {
    if (disposed || handling || options.isPaused?.()) {
      return;
    }

    if (!options.expectedAddress) {
      return;
    }

    handling = true;

    try {
      const snapshot = await inspectWalletConnection(options.expectedAddress);

      if (disposed || options.isPaused?.()) {
        return;
      }

      if (snapshot.status === "reconnecting") {
        return;
      }

      if (snapshot.status === "disconnected") {
        options.onDisconnected();
        return;
      }

      if (snapshot.status === "account_changed" && snapshot.activeAccount) {
        options.onAccountChanged(snapshot.activeAccount);
      }
    } finally {
      handling = false;
    }
  };

  const unwatchAccount = watchAccount(wagmiConfig, {
    onChange() {
      scheduleInspection();
    }
  });

  const handleFocus = () => {
    scheduleInspection();
  };

  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleFocus);

  void runInspection();

  return () => {
    disposed = true;

    if (debounceTimer !== undefined) {
      window.clearTimeout(debounceTimer);
    }

    unwatchAccount();
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleFocus);
  };
}
