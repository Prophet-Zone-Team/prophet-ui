"use client";

import { createWalletClient, custom, type Hex, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";

import { getWalletClientForAddress } from "@/components/trading/wallet-provider";

export async function createViemClobWalletClient(walletAddress: string): Promise<WalletClient> {
  return getWalletClientForAddress(walletAddress);
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
