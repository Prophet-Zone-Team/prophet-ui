import { cookieStorage, createStorage, createConfig } from "wagmi";

import {
  FUNDING_EVM_CHAINS,
  buildFundingEvmTransports,
} from "@/config/funding/evm-chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { metaMaskWallet, tokenPocketWallet, okxWallet, bitgetWallet, binanceWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { Metadata } from "./metadata";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        okxWallet,
        metaMaskWallet,
        tokenPocketWallet,
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
    projectId: process.env.NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID || "",
  }
);

export const wagmiConfig = createConfig({
  chains: [...FUNDING_EVM_CHAINS],
  connectors,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: buildFundingEvmTransports(),
});

export const wagmiChains = wagmiConfig.chains;

export type WagmiChainId = (typeof wagmiConfig.chains)[number]["id"];
