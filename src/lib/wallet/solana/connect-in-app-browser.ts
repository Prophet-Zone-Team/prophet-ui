"use client";

import type { WalletAdapter } from "@solana/wallet-adapter-base";

import {
  getInAppBrowserWalletKind,
  isInWalletInAppBrowser,
  type InAppBrowserWalletKind,
} from "@/context/rainbowkit/utils";
import { ensureSolanaWallet } from "@/lib/wallet/tokenpocket/ensure-matic-wallet";
import {
  getInAppSolanaWalletName,
  resolveInAppSolanaWallet,
} from "@/lib/wallet/solana/in-app-adapters";

function isUserRejectedRequest(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 4001
  );
}

function mapConnectError(error: unknown): Error {
  if (isUserRejectedRequest(error)) {
    return new Error("Wallet connection was rejected.");
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "WalletNotSelectedError"
  ) {
    return new Error("Select a Solana wallet before connecting.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Wallet connection failed.");
}

export async function connectInAppBrowserSolanaWallet<T extends WalletAdapter>(
  wallets: T[],
): Promise<{ address: string; adapter: T }> {
  if (!isInWalletInAppBrowser()) {
    throw new Error("Not in a supported in-app browser.");
  }

  const kind = getInAppBrowserWalletKind();

  if (!kind) {
    throw new Error("Not in a supported in-app browser.");
  }

  if (kind === "tokenpocket") {
    const solanaResult = await ensureSolanaWallet();

    if (solanaResult.reloadPending) {
      throw new Error(
        "Switching to the Solana wallet in TokenPocket. Tap Connect wallet again after the page reloads.",
      );
    }
  }

  const adapter = resolveInAppSolanaWallet(wallets, kind);

  if (!adapter) {
    throw new Error("No compatible Solana wallet provider found in this browser.");
  }

  try {
    await adapter.connect();
  } catch (error) {
    throw mapConnectError(error);
  }

  const address = adapter.publicKey?.toBase58();

  if (!address) {
    throw new Error("Wallet connection failed.");
  }

  return { address, adapter: adapter as T };
}

export { resolveInAppSolanaWallet, getInAppSolanaWalletName };
export type { InAppBrowserWalletKind };
