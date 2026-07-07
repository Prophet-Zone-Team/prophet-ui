"use client";

import { FUNDING_NETWORKS } from "@/config/funding/networks";
import { transferTronToken } from "@/lib/wallet/tron/transfer";
import { getFundingWalletAddress, getFundingWalletDisconnectHandler } from "@/store/use-funding-wallet-store";
import type { UnifiedWalletAccount, WalletTransferParams, WalletTransferResult } from "@/lib/wallet/types";

export function getActiveTronAccount(): UnifiedWalletAccount {
  const address = getFundingWalletAddress("tron");

  return {
    address,
    chainId: FUNDING_NETWORKS.tron.chainId,
    connected: Boolean(address),
    source: undefined,
  };
}

export async function disconnectTronWallet(): Promise<void> {
  const handler = getFundingWalletDisconnectHandler("tron");

  if (handler) {
    await handler();
  }
}

export async function ensureTronChain(): Promise<void> {
  const address = getFundingWalletAddress("tron");

  if (!address) {
    throw new Error("Connect a Tron wallet before continuing.");
  }
}

export async function signTronMessage(): Promise<`0x${string}`> {
  throw new Error("Tron funding wallet does not support message signing.");
}

export async function transferTronFundingToken(
  params: WalletTransferParams,
): Promise<WalletTransferResult> {
  return transferTronToken(params);
}
