"use client";

import Big from "big.js";
import { erc20Abi, parseUnits, type Address, type Hex } from "viem";

import { getFundingEvmChain } from "@/config/funding/evm-chains";
import { ensureFundingEvmChain } from "@/lib/funding/ensure-funding-evm-chain";
import { isNativeFundingToken } from "@/lib/funding/evm-balances";
import { getEvmWalletClient } from "@/lib/wallet/evm/evm-adapter";
import { isActiveWalletOnChain } from "@/lib/wallet/evm/evm-chain";
import type { WalletTransferParams, WalletTransferResult } from "@/lib/wallet/types";

export interface CollateralTransferParams {
  tokenAddress: string;
  toAddress: string;
  amountUsd: string;
  tokenDecimals: number;
}

export interface CollateralTransferWalletClient {
  sendTransaction(request: { to: Address; value: bigint }): Promise<Hex>;
  writeContract(request: {
    address: Address;
    abi: typeof erc20Abi;
    functionName: "transfer";
    args: readonly [Address, bigint];
  }): Promise<Hex>;
}

export async function transferCollateralWithWalletClient(
  walletClient: CollateralTransferWalletClient,
  { tokenAddress, toAddress, amountUsd, tokenDecimals }: CollateralTransferParams,
): Promise<{ txHash: Hex }> {
  if (Big(amountUsd).lte(0)) {
    throw new Error("Transfer amount must be greater than zero.");
  }

  const amount = parseUnits(amountUsd, tokenDecimals);

  if (isNativeFundingToken(tokenAddress)) {
    return {
      txHash: await walletClient.sendTransaction({
        to: toAddress as Address,
        value: amount,
      }),
    };
  }

  return {
    txHash: await walletClient.writeContract({
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [toAddress as Address, amount],
    }),
  };
}

/**
 * Ensures the active wallet (wagmi external or Privy embedded) is on the
 * target chain, then transfers a native or ERC20 token from it.
 */
export async function transferEvmToken({
  walletAddress,
  chainId,
  tokenAddress,
  toAddress,
  amount,
  tokenDecimals,
}: WalletTransferParams): Promise<WalletTransferResult & { txHash: Hex }> {
  const chain = getFundingEvmChain(chainId);

  if (!chain) {
    throw new Error(`Transfers are not configured for chainId ${chainId}.`);
  }

  await ensureFundingEvmChain(walletAddress, chainId);

  if (!isActiveWalletOnChain(walletAddress, chainId)) {
    throw new Error(
      `Switch your wallet to ${chain.name} (chainId ${chainId}) before transferring.`,
    );
  }

  const walletClient = await getEvmWalletClient(walletAddress, { chainId });

  const transferClient: CollateralTransferWalletClient = {
    sendTransaction: (request) =>
      walletClient.sendTransaction({
        account: walletAddress as Address,
        chain,
        ...request,
      }),
    writeContract: (request) =>
      walletClient.writeContract({
        account: walletAddress as Address,
        chain,
        ...request,
      }),
  };

  return transferCollateralWithWalletClient(transferClient, {
    tokenAddress,
    toAddress,
    amountUsd: amount,
    tokenDecimals,
  });
}
