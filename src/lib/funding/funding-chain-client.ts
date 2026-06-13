import { createPublicClient } from "viem";

import { getFundingEvmChain } from "@/config/funding/evm-chains";
import { getFundingRpcUrlFallback } from "@/config/funding/networks";

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
    transport: getFundingRpcUrlFallback(chainId),
  });

  clientCache.set(chainId, client);

  return client;
}
