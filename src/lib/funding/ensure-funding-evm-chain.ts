"use client";

import type { Chain } from "viem";
import { arbitrum, bsc, optimism, polygon } from "viem/chains";

import { getStoredTradingWalletProvider } from "@/components/trading/trading-wallet-session";
import {
  getEthereumProviderForWallet,
  type EthereumProvider,
} from "@/components/trading/wallet-provider";
import {
  FundingNetworkType,
  getFundingNetworkByChainId,
} from "@/config/funding/networks";
import { getProviderChainId } from "@/lib/trading/wallet-trading-chain";

const CHAIN_NOT_ADDED_ERROR_CODE = 4902;

const VIEM_CHAIN_BY_ID: Record<number, Chain> = {
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [bsc.id]: bsc,
  [polygon.id]: polygon,
};

function toChainIdHex(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

function getViemChain(chainId: number): Chain {
  const chain = VIEM_CHAIN_BY_ID[chainId];

  if (!chain) {
    throw new Error(`No wallet chain configuration for chainId ${chainId}.`);
  }

  return chain;
}

export async function ensureFundingEvmChain(
  walletAddress: string,
  chainId: number,
): Promise<void> {
  const network = getFundingNetworkByChainId(chainId);

  if (!network || network.chainType !== FundingNetworkType.EVM) {
    throw new Error(`Chain ${chainId} is not a supported EVM funding network.`);
  }

  const targetChain = getViemChain(chainId);
  const provider = await getEthereumProviderForWallet(
    walletAddress,
    getStoredTradingWalletProvider(walletAddress),
  );

  const currentChainId = await getProviderChainId(provider);

  if (currentChainId === chainId) {
    return;
  }

  const chainIdHex = toChainIdHex(chainId);

  try {
    await switchEthereumChain(provider, chainIdHex);
  } catch (error) {
    if (isUserRejectedRequest(error)) {
      throw new Error(
        `Wallet network switch was rejected. Switch to ${network.chainName} (chainId ${chainId}) to continue.`,
      );
    }

    if (isChainNotAddedError(error)) {
      await addEthereumChain(provider, targetChain);
      const chainIdAfterAdd = await getProviderChainId(provider);

      if (chainIdAfterAdd !== chainId) {
        await switchEthereumChain(provider, chainIdHex);
      }
    } else {
      throw error;
    }
  }

  const nextChainId = await getProviderChainId(provider);

  if (nextChainId !== chainId) {
    throw new Error(
      `Switch your wallet to ${network.chainName} (chainId ${chainId}) before continuing.`,
    );
  }
}

async function switchEthereumChain(provider: EthereumProvider, chainIdHex: string) {
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: chainIdHex }],
  });
}

async function addEthereumChain(provider: EthereumProvider, chain: Chain) {
  const rpcUrl = chain.rpcUrls.default.http[0];

  if (!rpcUrl) {
    throw new Error(`No default RPC URL configured for chainId ${chain.id}.`);
  }

  await provider.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: toChainIdHex(chain.id),
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: [rpcUrl],
        blockExplorerUrls: chain.blockExplorers?.default.url
          ? [chain.blockExplorers.default.url]
          : undefined,
      },
    ],
  });
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
