import { polygon, arbitrum, bsc, optimism } from "viem/chains";
import { cookieStorage, createStorage, http } from "wagmi";
import { createConfig } from "@privy-io/wagmi";

export const wagmiConfig = createConfig({
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
