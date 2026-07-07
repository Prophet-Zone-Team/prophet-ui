"use client";

import { parseUnits } from "viem";

import type { WalletTransferParams, WalletTransferResult } from "@/lib/wallet/types";
import { getTronFundingWalletInstance } from "@/lib/wallet/tron/funding-wallet-instance";

export async function transferTronToken(
  params: WalletTransferParams,
): Promise<WalletTransferResult> {
  const wallet = getTronFundingWalletInstance();

  if (!wallet) {
    throw new Error("Connect a Tron wallet before transferring funds.");
  }

  if (params.walletAddress && wallet.walletAddress !== params.walletAddress) {
    throw new Error("Active Tron wallet does not match the requested address.");
  }

  if (params.symbol?.toUpperCase() === "TRX") {
    const txHash = await wallet.transferTRX(params.toAddress, params.amount);
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
