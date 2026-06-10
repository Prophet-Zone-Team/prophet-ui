"use client";

import type { Chain } from "viem";
import {
  getWalletClientForAddress,
  requestWalletRpc,
} from "@/components/trading/wallet-provider";
import { switchChain } from "wagmi/actions";

import { getFundingEvmChain } from "@/config/funding/evm-chains";
import {
  FundingNetworkType,
  getFundingNetworkByChainId,
  getFundingRpcUrl,
} from "@/config/funding/networks";
import { type WagmiChainId, wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import {
  isWagmiOnChain,
  waitForWalletOnChain,
} from "@/lib/trading/wallet-chain-sync";

const CHAIN_NOT_ADDED_ERROR_CODE = 4902;

export async function ensureFundingEvmChain(
  walletAddress: string,
  chainId: number,
): Promise<void> {
  const network = getFundingNetworkByChainId(chainId);

  if (!network || network.chainType !== FundingNetworkType.EVM) {
    throw new Error(`Chain ${chainId} is not a supported EVM funding network.`);
  }

  if (isWagmiOnChain(chainId)) {
    return;
  }

  const targetChain = getViemChain(chainId);

  try {
    await switchChain(wagmiConfig, { chainId: chainId as WagmiChainId });
  } catch (error) {
    if (isUserRejectedRequest(error)) {
      throw new Error(
        `Wallet network switch was rejected. Switch to ${network.chainName} (chainId ${chainId}) to continue.`,
      );
    }

    const client = await getWalletClientForAddress(walletAddress);

    try {
      await client.switchChain({ id: chainId });
    } catch (switchError) {
      if (isChainNotAddedError(switchError)) {
        const rpcUrl = getFundingRpcUrl(chainId);

        await requestWalletRpc(walletAddress, {
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: toChainIdHex(chainId),
              chainName: targetChain.name,
              nativeCurrency: targetChain.nativeCurrency,
              rpcUrls: [rpcUrl],
              blockExplorerUrls: targetChain.blockExplorers?.default.url
                ? [targetChain.blockExplorers.default.url]
                : undefined,
            },
          ],
        });

        await client.switchChain({ id: chainId });
      } else {
        throw switchError;
      }
    }
  }

  try {
    await waitForWalletOnChain(walletAddress, chainId);
  } catch {
    throw new Error(
      `Switch your wallet to ${network.chainName} (chainId ${chainId}) before continuing.`,
    );
  }
}

function getViemChain(chainId: number): Chain {
  const chain = getFundingEvmChain(chainId);

  if (!chain) {
    throw new Error(`No wallet chain configuration for chainId ${chainId}.`);
  }

  return chain;
}

function toChainIdHex(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

function isUserRejectedRequest(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 4001
  );
}

function isChainNotAddedError(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const code = (error as { code?: unknown }).code;

  return code === CHAIN_NOT_ADDED_ERROR_CODE || code === "4902";
}
