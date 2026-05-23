"use client";

import {
  getAuthorizedWalletAccounts,
  getInjectedEthereumProviders,
  getPrimaryAuthorizedWalletAccount,
  isWalletAddressAuthorized,
  type EthereumProvider,
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

export async function inspectWalletConnection(
  expectedAddress?: string,
): Promise<WalletConnectionSnapshot> {
  const accounts = await getAuthorizedWalletAccounts();

  if (!expectedAddress) {
    return {
      accounts,
      status: "matched",
      activeAccount: getPrimaryAuthorizedWalletAccount(accounts),
    };
  }

  if (accounts.length === 0) {
    return {
      accounts,
      status: "disconnected",
    };
  }

  if (isWalletAddressAuthorized(expectedAddress, accounts)) {
    return {
      accounts,
      status: "matched",
      activeAccount: expectedAddress,
    };
  }

  return {
    accounts,
    status: "account_changed",
    activeAccount: getPrimaryAuthorizedWalletAccount(accounts),
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

  const providers = getInjectedEthereumProviders();
  const cleanups: Array<() => void> = [];

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

  for (const provider of providers) {
    cleanups.push(attachAccountsChangedListener(provider, scheduleInspection));
  }

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

    for (const cleanup of cleanups) {
      cleanup();
    }

    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleFocus);
  };
}

function attachAccountsChangedListener(
  provider: EthereumProvider,
  onAccountsChanged: (accounts: string[]) => void,
) {
  const maybeProvider = provider as EthereumProvider & {
    on?: (event: string, listener: (accounts: string[]) => void) => void;
    removeListener?: (event: string, listener: (accounts: string[]) => void) => void;
  };

  if (typeof maybeProvider.on !== "function") {
    return () => undefined;
  }

  const listener = (accounts: string[]) => {
    onAccountsChanged(accounts);
  };

  maybeProvider.on("accountsChanged", listener);

  return () => {
    maybeProvider.removeListener?.("accountsChanged", listener);
  };
}
