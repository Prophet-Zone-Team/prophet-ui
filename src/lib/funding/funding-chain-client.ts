import { createPublicClient, http } from "viem";

import { getFundingEvmChain } from "@/config/funding/evm-chains";
import { getFundingRpcUrl } from "@/config/funding/networks";

export type FundingPublicClient = ReturnType<typeof createPublicClient>;

const clientCache = new Map<number, FundingPublicClient>();

export function getFundingPublicClient(chainId: number): FundingPublicClient {
  const cached = clientCache.get(chainId);

  if (cached) {
    return cached;
  }

  const chain = getFundingEvmChain(chainId);

  if (!chain) {
    throw new Error(`No viem chain configured for funding chainId: ${chainId}`);
  }

  const client = createPublicClient({
    chain,
    transport: http(getFundingRpcUrl(chainId)),
  });

  clientCache.set(chainId, client);

  return client;
}
