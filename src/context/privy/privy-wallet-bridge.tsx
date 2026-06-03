"use client";

import { useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { getAccount } from "wagmi/actions";
import type { ConnectedWallet } from "@privy-io/react-auth";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import { useAuthStore } from "@/store/auth-store";

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

export function findPrivyWallet(
  expectedAddress?: string,
): ConnectedWallet | undefined {
  if (expectedAddress) {
    const matched = connectedWalletsRef.find((wallet) =>
      addressesMatch(wallet.address, expectedAddress),
    );

    if (matched) {
      return matched;
    }
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
}): Promise<ConnectedWallet | undefined> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_WALLET_WAIT_MS;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const wallet = findPrivyWallet(options?.expectedAddress);

    if (wallet && setActiveWalletRef) {
      return wallet;
    }

    await sleep(WALLET_POLL_INTERVAL_MS);
  }

  return undefined;
}

export async function activatePrivyWallet(
  expectedAddress?: string,
): Promise<string | undefined> {
  const wallet = await waitForPrivyWallet({ expectedAddress });

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

    const account = getAccount(wagmiConfig);

    if (account.isConnected && account.address) {
      return;
    }

    const expectedAddress = useAuthStore.getState().session?.walletAddress;
    const wallet = findPrivyWallet(expectedAddress) ?? wallets[0];

    if (wallet) {
      void setActiveWallet(wallet);
    }
  }, [authenticated, ready, setActiveWallet, wallets]);

  return null;
}
