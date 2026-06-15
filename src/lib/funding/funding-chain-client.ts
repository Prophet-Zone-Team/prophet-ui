import { createPublicClient, fallback, http } from "viem";

import { getFundingEvmChain } from "@/config/funding/evm-chains";
import { getFundingRpcUrls, getSignedRpcHttpConfig } from "@/config/funding/networks";

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

  const { rpcUrls, networkName } = getFundingRpcUrls(chainId);

  const client = createPublicClient({
    chain,
    transport: fallback(
      rpcUrls.map((rpc) => http(rpc, getSignedRpcHttpConfig(rpc, networkName))),
    ),
  });

  clientCache.set(chainId, client);

  return client;
}
