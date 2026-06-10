"use client";

import { erc20Abi, parseUnits, type Address, type Chain, type Hex } from "viem";

import { getWalletClientForAddress } from "@/components/trading/wallet-provider";
import { ensureFundingEvmChain } from "@/lib/funding/ensure-funding-evm-chain";
import { isNativeFundingToken } from "@/lib/funding/evm-balances";
import { isWagmiOnChain } from "@/lib/trading/wallet-chain-sync";
import Big from "big.js";
import { getFundingEvmChain } from "@/config/funding/evm-chains";

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

export async function transferCollateralFromConnectedWallet({
  walletAddress,
  tokenAddress,
  toAddress,
  amountUsd,
  tokenDecimals,
  chainId,
}: CollateralTransferParams & {
  walletAddress: string;
  chainId: number;
}): Promise<{ txHash: Hex }> {
  const chain = getFundingEvmChain(chainId);

  if (!chain) {
    throw new Error(`Transfers are not configured for chainId ${chainId}.`);
  }

  await ensureFundingEvmChain(walletAddress, chainId);

  if (!isWagmiOnChain(chainId)) {
    throw new Error(`Switch your wallet to ${chain.name} (chainId ${chainId}) before transferring.`);
  }

  const walletClient = await getWalletClientForAddress(walletAddress, { chainId });

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
    amountUsd,
    tokenDecimals,
  });
}
