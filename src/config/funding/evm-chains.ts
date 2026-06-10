import type { Chain } from "viem";
import {
  abstract,
  arbitrum,
  avalanche,
  base,
  berachain,
  bsc,
  gnosis,
  hyperEvm,
  mainnet,
  monad,
  optimism,
  plasma,
  polygon,
  scroll,
  xLayer,
} from "viem/chains";
import { http } from "wagmi";

import { getEvmFundingNetworks, getFundingRpcUrl } from "@/config/funding/networks";

export const FUNDING_EVM_CHAINS = [
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
] as const satisfies readonly Chain[];

export const FUNDING_EVM_CHAIN_BY_ID: Record<number, Chain> = Object.fromEntries(
  FUNDING_EVM_CHAINS.map((chain) => [chain.id, chain]),
);

export function getFundingEvmChain(chainId: number): Chain | undefined {
  return FUNDING_EVM_CHAIN_BY_ID[chainId];
}

export function buildFundingEvmTransports(): Record<number, ReturnType<typeof http>> {
  return Object.fromEntries(
    FUNDING_EVM_CHAINS.map((chain) => [chain.id, http(getFundingRpcUrl(chain.id))]),
  );
}

for (const network of getEvmFundingNetworks()) {
  if (!FUNDING_EVM_CHAIN_BY_ID[network.chainId]) {
    throw new Error(
      `Missing viem chain configuration for funding network ${network.chainName} (chainId ${network.chainId}).`,
    );
  }
}
