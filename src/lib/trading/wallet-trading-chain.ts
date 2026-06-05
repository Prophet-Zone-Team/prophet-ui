"use client";

import { switchChain } from "wagmi/actions";

import { wagmiConfig } from "@/context/rainbowkit/wagmi-config";

import {
  getWalletClientForAddress,
  requestWalletRpc,
} from "@/components/trading/wallet-provider";
import { POLYGON_NETWORK } from "@/lib/market/deposit-assets";
import {
  isWagmiOnChain,
  waitForWalletOnChain,
} from "@/lib/trading/wallet-chain-sync";

export const TRADING_CHAIN_ID = POLYGON_NETWORK.chainId;

const CHAIN_NOT_ADDED_ERROR_CODE = 4902;

export async function ensureTradingChain(
  walletAddress: string,
  options?: {
    onChecking?: () => void;
    onSwitching?: () => void;
  },
): Promise<void> {
  options?.onChecking?.();

  if (isWagmiOnChain(TRADING_CHAIN_ID)) {
    return;
  }

  options?.onSwitching?.();

  try {
    await switchChain(wagmiConfig, { chainId: TRADING_CHAIN_ID });
  } catch (error) {
    if (isUserRejectedRequest(error)) {
      throw new Error(
        "Wallet network switch was rejected. Switch to Polygon mainnet (chainId 137) to continue.",
      );
    }

    const client = await getWalletClientForAddress(walletAddress);

    try {
      await client.switchChain({ id: TRADING_CHAIN_ID });
    } catch (switchError) {
      if (isChainNotAddedError(switchError)) {
        await requestWalletRpc(walletAddress, {
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

        await client.switchChain({ id: TRADING_CHAIN_ID });
      } else {
        throw switchError;
      }
    }
  }

  try {
    await waitForWalletOnChain(walletAddress, TRADING_CHAIN_ID);
  } catch {
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
