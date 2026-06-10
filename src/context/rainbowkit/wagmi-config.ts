import { cookieStorage, createStorage } from "wagmi";
import { createConfig } from "@privy-io/wagmi";

import {
  FUNDING_EVM_CHAINS,
  buildFundingEvmTransports,
} from "@/config/funding/evm-chains";

export const wagmiConfig = createConfig({
  chains: [...FUNDING_EVM_CHAINS],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: buildFundingEvmTransports(),
});

export const wagmiChains = wagmiConfig.chains;

export type WagmiChainId = (typeof wagmiConfig.chains)[number]["id"];
