"use client";

import { getStoredTradingWalletProvider } from "@/components/trading/trading-wallet-session";
import {
  getEthereumProviderForWallet,
  type EthereumProvider,
} from "@/components/trading/wallet-provider";
import { POLYGON_NETWORK } from "@/lib/market/deposit-assets";

export const TRADING_CHAIN_ID = POLYGON_NETWORK.chainId;

const CHAIN_NOT_ADDED_ERROR_CODE = 4902;

export async function getProviderChainId(
  provider: EthereumProvider,
): Promise<number | undefined> {
  const chainId = await provider.request({
    method: "eth_chainId",
  });

  if (typeof chainId === "string") {
    return Number.parseInt(chainId, 16);
  }

  if (typeof chainId === "number") {
    return chainId;
  }

  return undefined;
}

export async function ensureTradingChain(
  walletAddress: string,
  options?: {
    onChecking?: () => void;
    onSwitching?: () => void;
  },
): Promise<void> {
  const provider = await getEthereumProviderForWallet(
    walletAddress,
    getStoredTradingWalletProvider(walletAddress),
  );

  options?.onChecking?.();

  const currentChainId = await getProviderChainId(provider);

  if (currentChainId === TRADING_CHAIN_ID) {
    return;
  }

  options?.onSwitching?.();

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_NETWORK.chainIdHex }],
    });
  } catch (error) {
    if (isUserRejectedRequest(error)) {
      throw new Error("Wallet network switch was rejected. Switch to Polygon mainnet (chainId 137) to continue.");
    }

    if (isChainNotAddedError(error)) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: POLYGON_NETWORK.chainIdHex,
            chainName: POLYGON_NETWORK.chainName,
            nativeCurrency: POLYGON_NETWORK.nativeCurrency,
            rpcUrls: [...POLYGON_NETWORK.rpcUrls],
            blockExplorerUrls: [...POLYGON_NETWORK.blockExplorerUrls],
          },
        ],
      });

      const chainIdAfterAdd = await getProviderChainId(provider);

      if (chainIdAfterAdd !== TRADING_CHAIN_ID) {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: POLYGON_NETWORK.chainIdHex }],
        });
      }
    } else {
      throw error;
    }
  }

  const nextChainId = await getProviderChainId(provider);

  if (nextChainId !== TRADING_CHAIN_ID) {
    throw new Error(
      `Switch your wallet to Polygon mainnet (chainId ${TRADING_CHAIN_ID}) before signing.`,
    );
  }
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
