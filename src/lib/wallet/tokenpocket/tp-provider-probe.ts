"use client";

import { getTpSdk } from "@/lib/wallet/tokenpocket/tp-sdk-client";

export type TpInjectedSolanaProvider = {
  connect?: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58: () => string } }>;
  disconnect?: () => Promise<void>;
  publicKey?: { toBase58: () => string } | null;
  signTransaction?: (transaction: unknown) => Promise<unknown>;
  signAllTransactions?: (transactions: unknown[]) => Promise<unknown[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  isPhantom?: boolean;
  isTokenPocket?: boolean;
};

function getWindowTronWeb(): unknown {
  if (typeof window === "undefined") {
    return undefined;
  }

  console.log("getWindowTronWeb window.tronWeb: %o", window.tronWeb);
  console.log("getWindowTronWeb window.tronLink?.tronWeb: %o", window.tronLink?.tronWeb);

  return window.tronWeb ?? window.tronLink?.tronWeb;
}

export function probeTokenPocketSolanaProvider(): TpInjectedSolanaProvider | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const candidate = window.solana as TpInjectedSolanaProvider | undefined;

  if (!candidate?.connect) {
    return undefined;
  }

  return candidate;
}

export function probeTokenPocketTronReady(): boolean {
  return Boolean(getWindowTronWeb());
}

export async function getTpCurrentBlockchain(): Promise<string | undefined> {
  try {
    const tp = await getTpSdk();
    const current = await tp.getCurrentWallet();

    if (current.result === true && typeof current.data?.blockchain === "string") {
      return current.data.blockchain;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
