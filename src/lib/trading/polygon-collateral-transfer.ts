"use client";

import { createWalletClient, custom, erc20Abi, parseUnits, type Address, type Chain, type Hex } from "viem";
import { arbitrum, bsc, optimism, polygon } from "viem/chains";

import { getStoredTradingWalletProvider } from "@/components/trading/trading-wallet-session";
import { getEthereumProviderForWallet } from "@/components/trading/wallet-provider";
import Big from "big.js";

const VIEM_CHAIN_BY_ID: Record<number, Chain> = {
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [bsc.id]: bsc,
  [polygon.id]: polygon,
};

export async function transferCollateralFromConnectedWallet({
  walletAddress,
  tokenAddress,
  toAddress,
  amountUsd,
  tokenDecimals,
  chainId,
}: {
  walletAddress: string;
  tokenAddress: string;
  toAddress: string;
  amountUsd: string;
  tokenDecimals: number;
  chainId: number;
}): Promise<{ txHash: Hex }> {
  if (Big(amountUsd).lte(0)) {
    throw new Error("Transfer amount must be greater than zero.");
  }

  const chain = VIEM_CHAIN_BY_ID[chainId];

  if (!chain) {
    throw new Error(`Transfers are not configured for chainId ${chainId}.`);
  }

  const provider = await getEthereumProviderForWallet(walletAddress, getStoredTradingWalletProvider(walletAddress));
  const walletClient = createWalletClient({
    account: walletAddress as Address,
    chain,
    transport: custom(provider),
  });
  const amount = parseUnits(amountUsd, tokenDecimals);

  return {
    txHash: await walletClient.writeContract({
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [toAddress as Address, amount],
    }),
  };
}
