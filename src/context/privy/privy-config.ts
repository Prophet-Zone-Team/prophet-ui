import type { PrivyClientConfig } from "@privy-io/react-auth";
import { arbitrum, bsc, optimism, polygon } from "viem/chains";

const walletConnectCloudProjectId =
  process.env.NEXT_PUBLIC_RAINBOWKIT_PROJECT_ID?.trim() || undefined;

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() ?? "";
export const PRIVY_CLIENT_ID =
  process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID?.trim() || undefined;

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "google", "wallet"],
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
    showWalletUIs: true,
  },
  appearance: {
    walletChainType: "ethereum-only",
  },
  defaultChain: polygon,
  supportedChains: [polygon, arbitrum, bsc, optimism],
  walletConnectCloudProjectId,
};
