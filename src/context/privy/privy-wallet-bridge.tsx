"use client";

import { useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import type { ConnectedWallet } from "@privy-io/react-auth";

import { resolvePrivyLoginEmail } from "@/context/privy/resolve-privy-login-email";
import { useAuthStore } from "@/store/auth-store";
import type { AuthLoginMethod } from "@/store/auth-store";

const WALLET_POLL_INTERVAL_MS = 200;
const DEFAULT_WALLET_WAIT_MS = 20_000;

let connectedWalletsRef: ConnectedWallet[] = [];
let privyAuthenticatedRef = false;
let privyLoginEmailRef: string | undefined;
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

export function getPrivyLoginEmail() {
  return privyLoginEmailRef;
}

export async function waitForPrivyLoginEmail(options?: {
  timeoutMs?: number;
}): Promise<string | undefined> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_WALLET_WAIT_MS;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const email = getPrivyLoginEmail();

    if (email) {
      return email;
    }

    await sleep(WALLET_POLL_INTERVAL_MS);
  }

  return getPrivyLoginEmail();
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

    if (wallet) {
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

  if (!wallet) {
    return undefined;
  }

  return wallet.address;
}

/**
 * Mirrors the Privy auth state and wallet list into module-level refs so
 * non-React modules (e.g. the EVM signer source) can resolve the active
 * Privy embedded wallet without a wagmi connector.
 */
export function PrivyWalletBridge() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  useEffect(() => {
    privyAuthenticatedRef = ready && authenticated;
  }, [authenticated, ready]);

  useEffect(() => {
    privyLoginEmailRef =
      authenticated && user ? resolvePrivyLoginEmail(user) : undefined;
  }, [authenticated, user]);

  useEffect(() => {
    connectedWalletsRef = wallets;
  }, [wallets]);

  return null;
}
