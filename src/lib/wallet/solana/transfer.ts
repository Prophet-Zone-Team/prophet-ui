"use client";

import { parseUnits } from "viem";

import type { WalletTransferParams, WalletTransferResult } from "@/lib/wallet/types";
import { getFundingWalletInstance } from "@/lib/wallet/solana/funding-wallet-instance";
import { isSolanaNativeToken } from "@/lib/wallet/solana/wallet";

export async function transferSolanaToken(
  params: WalletTransferParams,
): Promise<WalletTransferResult> {
  const wallet = getFundingWalletInstance();

  if (!wallet) {
    throw new Error("Connect a Solana wallet before transferring funds.");
  }

  if (params.walletAddress && wallet.address !== params.walletAddress) {
    throw new Error("Active Solana wallet does not match the requested address.");
  }

  if (isSolanaNativeToken(params.tokenAddress)) {
    const txHash = await wallet.transferSOL(params.toAddress, params.amount);
    return { txHash };
  }

  const amountBaseUnits = parseUnits(params.amount, params.tokenDecimals).toString();
  const txHash = await wallet.transferToken(
    params.tokenAddress,
    params.toAddress,
    amountBaseUnits,
  );

  return { txHash };
}
