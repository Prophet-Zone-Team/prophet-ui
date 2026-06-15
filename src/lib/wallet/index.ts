"use client";

import { FundingNetworkType } from "@/config/funding/networks";
import {
  disconnectEvmWallet,
  signEvmMessage,
} from "@/lib/wallet/evm/evm-adapter";
import { ensureEvmChain } from "@/lib/wallet/evm/evm-chain";
import { transferEvmToken } from "@/lib/wallet/evm/evm-transfer";
import { getActiveEvmAccount } from "@/lib/wallet/evm/signer-source";
import {
  UnsupportedChainTypeError,
  type ChainType,
  type EnsureChainOptions,
  type WalletAdapter,
  type WalletTransferParams,
  type WalletTransferResult,
} from "@/lib/wallet/types";

export * from "@/lib/wallet/types";

const evmWalletAdapter: WalletAdapter = {
  chainType: "evm",
  getActiveAccount: getActiveEvmAccount,
  signMessage: signEvmMessage,
  ensureChain: ensureEvmChain,
  transferToken: transferEvmToken,
  disconnect: disconnectEvmWallet,
};

/**
 * Single entry point for chain-family-specific wallet operations. Solana and
 * Tron adapters can be registered here without touching call sites.
 */
export function getWalletAdapter(chainType: ChainType): WalletAdapter {
  if (chainType === "evm") {
    return evmWalletAdapter;
  }

  throw new UnsupportedChainTypeError(chainType);
}

export function fundingNetworkTypeToChainType(
  networkType: FundingNetworkType,
): ChainType {
  switch (networkType) {
    case FundingNetworkType.EVM:
      return "evm";
    case FundingNetworkType.SVM:
      return "solana";
    default:
      throw new UnsupportedChainTypeError(networkType);
  }
}

export async function ensureWalletChain(params: {
  chainType: ChainType;
  walletAddress: string;
  chainId: number;
  options?: EnsureChainOptions;
}): Promise<void> {
  const adapter = getWalletAdapter(params.chainType);

  await adapter.ensureChain(params.walletAddress, params.chainId, params.options);
}

/**
 * Unified deposit transfer entry: switches the user's wallet to the target
 * chain and sends the funds from their own wallet. Used by the main deposit
 * flow and the private-mode funding wallet top up.
 */
export async function transferDepositFunds(
  params: WalletTransferParams & { chainType: ChainType },
): Promise<WalletTransferResult> {
  const { chainType, ...transferParams } = params;
  const adapter = getWalletAdapter(chainType);

  return adapter.transferToken(transferParams);
}
