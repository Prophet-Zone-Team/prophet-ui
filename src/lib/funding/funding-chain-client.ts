import { createPublicClient, http } from "viem";
import { arbitrum, bsc, optimism, polygon } from "viem/chains";

import { getFundingRpcUrl } from "@/config/funding/networks";

function createArbitrumFundingClient() {
  return createPublicClient({
    chain: arbitrum,
    transport: http(getFundingRpcUrl(arbitrum.id)),
  });
}

export type FundingPublicClient = ReturnType<typeof createArbitrumFundingClient>;

let arbitrumClient: FundingPublicClient | undefined;
let optimismClient: FundingPublicClient | undefined;
let bscClient: FundingPublicClient | undefined;
let polygonClient: FundingPublicClient | undefined;

export function getFundingPublicClient(chainId: number): FundingPublicClient {
  if (chainId === arbitrum.id) {
    arbitrumClient ??= createArbitrumFundingClient();
    return arbitrumClient;
  }

  if (chainId === optimism.id) {
    optimismClient ??= createPublicClient({
      chain: optimism,
      transport: http(getFundingRpcUrl(optimism.id)),
    }) as unknown as FundingPublicClient;
    return optimismClient;
  }

  if (chainId === bsc.id) {
    bscClient ??= createPublicClient({
      chain: bsc,
      transport: http(getFundingRpcUrl(bsc.id)),
    }) as unknown as FundingPublicClient;
    return bscClient;
  }

  if (chainId === polygon.id) {
    polygonClient ??= createPublicClient({
      chain: polygon,
      transport: http(getFundingRpcUrl(polygon.id)),
    }) as unknown as FundingPublicClient;
    return polygonClient;
  }

  throw new Error(`No viem chain configured for funding chainId: ${chainId}`);
}
