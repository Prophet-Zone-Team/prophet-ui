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

  if (error instanceof Error) {
    return error;
  }

  return new Error("Wallet connection failed.");
}

export async function connectInAppBrowserSolanaWallet(params: {
  wallets: WalletAdapter[];
  select: (walletName: WalletAdapter["name"]) => void;
  connect: () => Promise<void>;
  getAddress: () => string | undefined;
}): Promise<string> {
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

  const wallet = resolveInAppSolanaWallet(params.wallets, kind);

  if (!wallet) {
    throw new Error("No compatible Solana wallet provider found in this browser.");
  }

  try {
    params.select(getInAppSolanaWalletName(kind));
    await params.connect();
  } catch (error) {
    throw mapConnectError(error);
  }

  const address = params.getAddress();

  if (!address) {
    throw new Error("Wallet connection failed.");
  }

  return address;
}

export { resolveInAppSolanaWallet, getInAppSolanaWalletName };
export type { InAppBrowserWalletKind };
