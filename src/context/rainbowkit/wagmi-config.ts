import {
  polygon,
  arbitrum,
  bsc,
  optimism,
  mainnet,
  monad,
  base,
  hyperEvm,
} from "viem/chains";
import { cookieStorage, createStorage, http } from "wagmi";
import { createConfig } from "@privy-io/wagmi";

export const wagmiConfig = createConfig({
  chains: [
    polygon,
    arbitrum,
    bsc,
    optimism,
    mainnet,
    monad,
    base,
    hyperEvm,
  ],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
    [optimism.id]: http(),
    [mainnet.id]: http(),
    [monad.id]: http(),
    [base.id]: http(),
    [hyperEvm.id]: http(),
  },
});

export const wagmiChains = wagmiConfig.chains;

export type WagmiChainId = (typeof wagmiConfig.chains)[number]["id"];
