"use client";

import { POLYGON_NETWORK } from "@/lib/market/deposit-assets";
import { ensureEvmChain } from "@/lib/wallet/evm/evm-chain";

export const TRADING_CHAIN_ID = POLYGON_NETWORK.chainId;

export async function ensureTradingChain(
  walletAddress: string,
  options?: {
    onChecking?: () => void;
    onSwitching?: () => void;
  },
): Promise<void> {
  await ensureEvmChain(walletAddress, TRADING_CHAIN_ID, {
    onChecking: options?.onChecking,
    onSwitching: options?.onSwitching,
    rejectionMessage:
      "Wallet network switch was rejected. Switch to Polygon mainnet (chainId 137) to continue.",
    timeoutMessage: `Switch your wallet to Polygon mainnet (chainId ${TRADING_CHAIN_ID}) before signing.`,
  });
}
