"use client";

import { useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { getAccount } from "wagmi/actions";
import type { ConnectedWallet } from "@privy-io/react-auth";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import {
  isExternalWagmiConnector,
  releaseExternalWalletConnection,
} from "@/lib/trading/wallet-disconnect";
import { useAuthStore } from "@/store/auth-store";
import type { AuthLoginMethod } from "@/store/auth-store";

const WALLET_POLL_INTERVAL_MS = 200;
const DEFAULT_WALLET_WAIT_MS = 20_000;

let setActiveWalletRef:
  | ((wallet: ConnectedWallet) => Promise<void>)
  | undefined;
let connectedWalletsRef: ConnectedWallet[] = [];
let privyAuthenticatedRef = false;
let walletSyncSuspendedRef = false;

export function suspendPrivyWalletSync() {
  walletSyncSuspendedRef = true;
}

export function resumePrivyWalletSync() {
  walletSyncSuspendedRef = false;
}

function addressesMatch(left: string, right: string) {
  return left.toLowerCase() === right.toLowerCase();
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function isPrivyAuthenticated() {
  return privyAuthenticatedRef;
}

export function isPrivyEmbeddedWallet(wallet: ConnectedWallet): boolean {
  return wallet.walletClientType === "privy" || wallet.connectorType === "embedded";
}

export function findPrivyEmbeddedWallet(
  expectedAddress?: string,
): ConnectedWallet | undefined {
  const embeddedWallets = connectedWalletsRef.filter(isPrivyEmbeddedWallet);

  if (expectedAddress) {
    const matched = embeddedWallets.find((wallet) =>
      addressesMatch(wallet.address, expectedAddress),
    );

    if (matched) {
      return matched;
    }
  }

  return embeddedWallets[0];
}

function prefersEmbeddedLogin(loginMethod: AuthLoginMethod | undefined) {
  return loginMethod === "email" || loginMethod === "google";
}

export function findPrivyWallet(
  expectedAddress?: string,
  options?: { preferEmbedded?: boolean },
): ConnectedWallet | undefined {
  if (options?.preferEmbedded) {
    // Embedded (email/google) logins must never fall back to an injected
    // external wallet (e.g. a still-connected OKX extension). Return the
    // embedded wallet or undefined so callers can keep waiting for it to load.
    return findPrivyEmbeddedWallet(expectedAddress);
  }

  if (expectedAddress) {
    const matched = connectedWalletsRef.find((wallet) =>
      addressesMatch(wallet.address, expectedAddress),
    );

    if (matched) {
      return matched;
    }
  }

  const external = connectedWalletsRef.find((wallet) => !isPrivyEmbeddedWallet(wallet));

  if (external) {
    return external;
  }

  return connectedWalletsRef[0];
}

export async function waitForPrivySessionReady(options?: {
  timeoutMs?: number;
}): Promise<boolean> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_WALLET_WAIT_MS;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (privyAuthenticatedRef) {
      return true;
    }

    await sleep(WALLET_POLL_INTERVAL_MS);
  }

  return privyAuthenticatedRef;
}

export async function waitForPrivyWallet(options?: {
  expectedAddress?: string;
  timeoutMs?: number;
  preferEmbedded?: boolean;
}): Promise<ConnectedWallet | undefined> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_WALLET_WAIT_MS;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const wallet = findPrivyWallet(options?.expectedAddress, {
      preferEmbedded: options?.preferEmbedded,
    });

    if (wallet && setActiveWalletRef) {
      return wallet;
    }

    await sleep(WALLET_POLL_INTERVAL_MS);
  }

  return undefined;
}

export async function activatePrivyWallet(
  expectedAddress?: string,
  options?: { preferEmbedded?: boolean },
): Promise<string | undefined> {
  const preferEmbedded =
    options?.preferEmbedded ??
    prefersEmbeddedLogin(useAuthStore.getState().loginMethod);

  const wallet = await waitForPrivyWallet({
    expectedAddress,
    preferEmbedded,
  });

  if (!wallet || !setActiveWalletRef) {
    return undefined;
  }

  await setActiveWalletRef(wallet);

  return wallet.address;
}

/**
 * Syncs the Privy wallet list into wagmi's active wallet so the existing
 * wagmi-based trading flow keeps working for embedded and external wallets.
 */
export function PrivyWalletBridge() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  useEffect(() => {
    privyAuthenticatedRef = ready && authenticated;
  }, [authenticated, ready]);

  useEffect(() => {
    setActiveWalletRef = setActiveWallet;
    connectedWalletsRef = wallets;

    return () => {
      if (setActiveWalletRef === setActiveWallet) {
        setActiveWalletRef = undefined;
      }
    };
  }, [setActiveWallet, wallets]);

  useEffect(() => {
    if (
      walletSyncSuspendedRef ||
      !ready ||
      !authenticated ||
      wallets.length === 0
    ) {
      return;
    }

    const store = useAuthStore.getState();
    const preferEmbedded = prefersEmbeddedLogin(store.loginMethod);
    const account = getAccount(wagmiConfig);
    const expectedAddress = store.session?.walletAddress;

    if (account.isConnected && account.address) {
      if (!preferEmbedded) {
        return;
      }

      const embedded = findPrivyEmbeddedWallet(expectedAddress);

      if (embedded && addressesMatch(account.address, embedded.address)) {
        return;
      }

      if (isExternalWagmiConnector(account.connector?.id)) {
        void releaseExternalWalletConnection().then(() => {
          const wallet =
            findPrivyWallet(expectedAddress, { preferEmbedded: true }) ??
            findPrivyEmbeddedWallet(expectedAddress);

          if (wallet) {
            void setActiveWallet(wallet);
          }
        });

        return;
      }
    }

    const wallet =
      findPrivyWallet(expectedAddress, { preferEmbedded }) ??
      (preferEmbedded ? findPrivyEmbeddedWallet() : wallets[0]);

    if (wallet) {
      void setActiveWallet(wallet);
    }
  }, [authenticated, ready, setActiveWallet, wallets]);

  return null;
}
