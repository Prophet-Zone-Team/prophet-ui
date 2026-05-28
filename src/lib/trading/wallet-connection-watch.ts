"use client";

import { getAccount, reconnect, watchAccount } from "wagmi/actions";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";

import {
  getPrimaryAuthorizedWalletAccount,
  isWalletAddressAuthorized,
} from "@/components/trading/wallet-provider";

export type WalletConnectionStatus =
  | "matched"
  | "disconnected"
  | "account_changed";

export interface WalletConnectionSnapshot {
  accounts: string[];
  status: WalletConnectionStatus;
  activeAccount?: string;
}

const DEBOUNCE_MS = 300;
const WALLET_RECONNECT_WAIT_MS = 10_000;

export interface WaitForWalletConnectionOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function waitForWalletConnection(
  expectedAddress: string,
  options?: WaitForWalletConnectionOptions,
): Promise<WalletConnectionSnapshot> {
  const timeoutMs = options?.timeoutMs ?? WALLET_RECONNECT_WAIT_MS;

  const resolveWhenReady = async () => {
    const snapshot = await inspectWalletConnection(expectedAddress);

    if (snapshot.status !== "disconnected") {
      return snapshot;
    }

    return undefined;
  };

  const immediate = await resolveWhenReady();

  if (immediate) {
    return immediate;
  }

  try {
    await reconnect(wagmiConfig);
  } catch {
    // Reconnect can fail when no persisted connector is available yet.
  }

  const afterReconnect = await resolveWhenReady();

  if (afterReconnect) {
    return afterReconnect;
  }

  if (typeof window === "undefined") {
    return inspectWalletConnection(expectedAddress);
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId: number | undefined;
    let unwatch: (() => void) | undefined;

    const finish = (snapshot: WalletConnectionSnapshot) => {
      if (settled) {
        return;
      }

      settled = true;

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      unwatch?.();
      options?.signal?.removeEventListener("abort", onAbort);
      resolve(snapshot);
    };

    const onAbort = () => {
      finish({
        accounts: [],
        status: "disconnected",
      });
    };

    if (options?.signal?.aborted) {
      onAbort();
      return;
    }

    options?.signal?.addEventListener("abort", onAbort);

    const inspect = async () => {
      const snapshot = await resolveWhenReady();

      if (snapshot) {
        finish(snapshot);
      }
    };

    unwatch = watchAccount(wagmiConfig, {
      onChange() {
        void inspect();
      },
    });

    void inspect();

    timeoutId = window.setTimeout(() => {
      void inspectWalletConnection(expectedAddress).then(finish);
    }, timeoutMs);
  });
}

export async function inspectWalletConnection(
  expectedAddress?: string,
): Promise<WalletConnectionSnapshot> {
  const account = getAccount(wagmiConfig);
  const connectedAddress = account.isConnected ? account.address : undefined;
  const accounts = connectedAddress ? [connectedAddress.toLowerCase()] : [];

  if (!expectedAddress) {
    return {
      accounts,
      status: "matched",
      activeAccount: connectedAddress,
    };
  }

  if (!connectedAddress) {
    return {
      accounts,
      status: "disconnected",
    };
  }

  if (isWalletAddressAuthorized(expectedAddress, accounts)) {
    return {
      accounts,
      status: "matched",
      activeAccount: connectedAddress,
    };
  }

  return {
    accounts,
    status: "account_changed",
    activeAccount: getPrimaryAuthorizedWalletAccount(accounts) ?? connectedAddress,
  };
}

interface SubscribeWalletConnectionOptions {
  expectedAddress?: string;
  isPaused?: () => boolean;
  onDisconnected: () => void;
  onAccountChanged: (nextAddress: string) => void;
}

export function subscribeWalletConnection(options: SubscribeWalletConnectionOptions) {
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
    },
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
