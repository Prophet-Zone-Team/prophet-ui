"use client";

import { isInTokenPocket } from "@/context/rainbowkit/utils";
import {
  TP_BLOCKCHAIN_POLYGON,
  TP_BLOCKCHAIN_SOLANA,
  TP_BLOCKCHAIN_TRON,
} from "@/lib/wallet/tokenpocket/constants";
import {
  ensureMaticWallet,
  type EnsureMaticWalletResult,
} from "@/lib/wallet/tokenpocket/ensure-matic-wallet";
import {
  getTpCurrentBlockchain,
  probeTokenPocketSolanaProvider,
  probeTokenPocketTronReady,
} from "@/lib/wallet/tokenpocket/tp-provider-probe";

const TP_NON_EVM_BLOCKCHAINS = new Set([
  TP_BLOCKCHAIN_TRON,
  TP_BLOCKCHAIN_SOLANA,
]);

function isNonEvmBlockchain(blockchain: string | undefined): boolean {
  if (!blockchain) {
    return false;
  }

  return TP_NON_EVM_BLOCKCHAINS.has(blockchain);
}

function hasActiveNonEvmProviderFallback(): boolean {
  return (
    probeTokenPocketTronReady() || Boolean(probeTokenPocketSolanaProvider())
  );
}

export function evaluateTpNonEvmWalletActive(
  inTokenPocket: boolean,
  blockchain: string | undefined,
  fallbackNonEvmProbe: boolean,
): boolean {
  if (!inTokenPocket) {
    return false;
  }

  if (blockchain === TP_BLOCKCHAIN_POLYGON) {
    return false;
  }

  if (isNonEvmBlockchain(blockchain)) {
    return true;
  }

  if (!blockchain) {
    return fallbackNonEvmProbe;
  }

  return false;
}

export async function isTpNonEvmWalletActive(): Promise<boolean> {
  const blockchain = await getTpCurrentBlockchain();

  return evaluateTpNonEvmWalletActive(
    isInTokenPocket(),
    blockchain,
    hasActiveNonEvmProviderFallback(),
  );
}

export async function switchTpToMaticWallet(): Promise<EnsureMaticWalletResult> {
  return ensureMaticWallet();
}
