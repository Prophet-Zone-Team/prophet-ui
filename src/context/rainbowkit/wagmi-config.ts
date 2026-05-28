import {
  polygon,
  arbitrum,
  bsc,
  optimism,
} from "viem/chains";
import { createConfig, http } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  okxWallet,
  bitgetWallet,
  binanceWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

import { Metadata } from "./metadata";

const projectId = process.env.NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID?.trim() ?? "";

if (!projectId && typeof window !== "undefined") {
  console.warn(
    "[wagmi] NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID is not set. WalletConnect may not work.",
  );
}

if (!projectId && process.env.NODE_ENV === "development") {
  console.warn(
    "[wagmi] Set NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID in .env.local for WalletConnect support.",
  );
}

export const wagmiConfig = createConfig({
  connectors: connectorsForWallets(
    [
      {
        groupName: "Recommended",
        wallets: [
          okxWallet,
          metaMaskWallet,
          bitgetWallet,
          binanceWallet,
          walletConnectWallet,
        ],
      },
    ],
    {
      appName: Metadata.name,
      appDescription: Metadata.description,
      appUrl: Metadata.url,
      appIcon: Metadata.icons[0],
      projectId: projectId || "00000000000000000000000000000000",
    },
  ),
  chains: [polygon, arbitrum, bsc, optimism],
  transports: {
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
    [optimism.id]: http(),
  },
  ssr: true,
});

export const wagmiChains = wagmiConfig.chains;

export type WagmiChainId = (typeof wagmiConfig.chains)[number]["id"];
