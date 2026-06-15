"use client";

import {
  FundingNetworkType,
  getFundingNetworkByChainId,
} from "@/config/funding/networks";
import { ensureEvmChain } from "@/lib/wallet/evm/evm-chain";

export async function ensureFundingEvmChain(
  walletAddress: string,
  chainId: number,
): Promise<void> {
  const network = getFundingNetworkByChainId(chainId);

  if (!network || network.chainType !== FundingNetworkType.EVM) {
    throw new Error(`Chain ${chainId} is not a supported EVM funding network.`);
  }

  await ensureEvmChain(walletAddress, chainId, {
    rejectionMessage: `Wallet network switch was rejected. Switch to ${network.chainName} (chainId ${chainId}) to continue.`,
    timeoutMessage: `Switch your wallet to ${network.chainName} (chainId ${chainId}) before continuing.`,
  });
}
