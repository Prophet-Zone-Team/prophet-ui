"use client";

import { createWalletClient, custom, erc20Abi, parseUnits, type Address, type Hex } from "viem";
import { polygon } from "viem/chains";

import { getStoredTradingWalletProvider } from "@/components/trading/trading-wallet-session";
import { getEthereumProviderForWallet } from "@/components/trading/wallet-provider";

const COLLATERAL_DECIMALS = 6;

export async function transferCollateralFromConnectedWallet({
  walletAddress,
  tokenAddress,
  toAddress,
  amountUsd,
}: {
  walletAddress: string;
  tokenAddress: string;
  toAddress: string;
  amountUsd: number;
}): Promise<{ txHash: Hex }> {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new Error("Transfer amount must be greater than zero.");
  }

  const provider = await getEthereumProviderForWallet(walletAddress, getStoredTradingWalletProvider(walletAddress));
  const walletClient = createWalletClient({
    account: walletAddress as Address,
    chain: polygon,
    transport: custom(provider),
  });
  const amount = parseUnits(amountUsd.toFixed(COLLATERAL_DECIMALS), COLLATERAL_DECIMALS);

  return {
    txHash: await walletClient.writeContract({
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [toAddress as Address, amount],
    }),
  };
}
