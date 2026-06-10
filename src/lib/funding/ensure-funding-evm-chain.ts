"use client";

import type { Chain } from "viem";
import { arbitrum, bsc, optimism, polygon } from "viem/chains";
import {
  getWalletClientForAddress,
  requestWalletRpc,
} from "@/components/trading/wallet-provider";
import { switchChain } from "wagmi/actions";

import { type WagmiChainId, wagmiConfig } from "@/context/rainbowkit/wagmi-config";
import {
  isWagmiOnChain,
  waitForWalletOnChain,
} from "@/lib/trading/wallet-chain-sync";
import {
  FundingNetworkType,
  getFundingNetworkByChainId,
} from "@/config/funding/networks";

const CHAIN_NOT_ADDED_ERROR_CODE = 4902;

const VIEM_CHAIN_BY_ID: Record<number, Chain> = {
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [bsc.id]: bsc,
  [polygon.id]: polygon,
};

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
        const rpcUrl = targetChain.rpcUrls.default.http[0];

        if (!rpcUrl) {
          throw new Error(`No default RPC URL configured for chainId ${chainId}.`);
        }

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
  const chain = VIEM_CHAIN_BY_ID[chainId];

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
