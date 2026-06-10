import {
  polygon,
  arbitrum,
  bsc,
  optimism,
  mainnet,
  monad,
  base,
  hyperEvm,
  abstract,
  avalanche,
  berachain,
  gnosis,
  plasma,
  scroll,
  xLayer,
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
    abstract,
    avalanche,
    berachain,
    gnosis,
    plasma,
    scroll,
    xLayer,
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
    [abstract.id]: http(),
    [avalanche.id]: http(),
    [berachain.id]: http(),
    [gnosis.id]: http(),
    [plasma.id]: http(),
    [scroll.id]: http(),
    [xLayer.id]: http(),
  },
});

export const wagmiChains = wagmiConfig.chains;

export type WagmiChainId = (typeof wagmiConfig.chains)[number]["id"];
