import {
  polygon,
  arbitrum,
  bsc,
  optimism,
} from "viem/chains";
import { createConfig, cookieStorage, createStorage, http } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  okxWallet,
  bitgetWallet,
  binanceWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

import { getAppIconUrl, getAppOrigin } from "@/context/rainbowkit/app-url";
import { Metadata } from "./metadata";

const projectId = process.env.NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID?.trim() ?? "";
const appOrigin = getAppOrigin();
const appIconUrl = getAppIconUrl();

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
      appUrl: appOrigin,
      appIcon: appIconUrl,
      projectId: projectId || "00000000000000000000000000000000",
      walletConnectParameters: {
        metadata: {
          name: Metadata.name,
          description: Metadata.description,
          url: appOrigin,
          icons: [appIconUrl],
        },
      },
    },
  ),
  chains: [polygon, arbitrum, bsc, optimism],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
    [optimism.id]: http(),
  },
});

export const wagmiChains = wagmiConfig.chains;

export type WagmiChainId = (typeof wagmiConfig.chains)[number]["id"];
