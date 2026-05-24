"use client";

import { createWalletClient, custom, type Address, type Hex, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";

import { getStoredTradingWalletProvider } from "@/components/trading/trading-wallet-session";
import { getEthereumProviderForWallet } from "@/components/trading/wallet-provider";

export async function createViemClobWalletClient(walletAddress: string): Promise<WalletClient> {
  const provider = await getEthereumProviderForWallet(walletAddress, getStoredTradingWalletProvider(walletAddress));

  return createWalletClient({
    account: walletAddress as Address,
    chain: polygon,
    transport: custom(provider),
  });
}

export function createLocalClobWalletClient(privateKey: Hex): WalletClient {
  return createWalletClient({
    account: privateKeyToAccount(privateKey),
    chain: polygon,
    transport: custom({
      request: async () => {
        throw new Error("Local order signing does not use the wallet transport.");
      },
    }),
  });
}
