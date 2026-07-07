"use client";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import { transferSolanaToken } from "@/lib/wallet/solana/transfer";
import { getFundingWalletAddress, getFundingWalletDisconnectHandler } from "@/store/use-funding-wallet-store";
import type { UnifiedWalletAccount, WalletTransferParams, WalletTransferResult } from "@/lib/wallet/types";

export function getActiveSolanaAccount(): UnifiedWalletAccount {
  const address = getFundingWalletAddress("solana");

  return {
    address,
    chainId: FUNDING_NETWORKS.solana.chainId,
    connected: Boolean(address),
    source: undefined,
  };
}

export async function disconnectSolanaWallet(): Promise<void> {
  const handler = getFundingWalletDisconnectHandler("solana");

  if (handler) {
    await handler();
  }
}

export async function ensureSolanaChain(): Promise<void> {
  const address = getFundingWalletAddress("solana");

  if (!address) {
    throw new Error("Connect a Solana wallet before continuing.");
  }
}

export async function signSolanaMessage(): Promise<`0x${string}`> {
  throw new Error("Solana funding wallet does not support message signing.");
}

export async function transferSolanaFundingToken(
  params: WalletTransferParams,
): Promise<WalletTransferResult> {
  return transferSolanaToken(params);
}
