import { polygon } from "viem/chains";
import { createConfig, createStorage, cookieStorage, http } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  okxWallet,
  bitgetWallet,
  binanceWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

import { Metadata } from "@/context/rainbowkit/metadata";

const projectId = process.env.NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID?.trim() ?? "";

export const privateFundingWagmiConfig = createConfig({
  connectors: connectorsForWallets(
    [
      {
        groupName: "Recommended",
        wallets: [okxWallet, metaMaskWallet, bitgetWallet, binanceWallet, walletConnectWallet],
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
  chains: [polygon],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
    key: "wc_private_funding",
  }),
  transports: {
    [polygon.id]: http(),
  },
});
