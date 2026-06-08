export enum FundingNetworkType {
  EVM = "evm",
  SVM = "svm",
  BTC = "btc",
}

export interface FundingNetwork {
  chainId: number;
  chainName: string;
  chainIcon: string;
  chainType: FundingNetworkType;
  defaultRpcUrl: string;
}

export const FUNDING_NETWORKS: Record<string, FundingNetwork> = {
  arbitrum: {
    chainId: 42161,
    chainName: "Arbitrum",
    chainIcon: "/networks/arbitrum.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://arb1.arbitrum.io/rpc",
  },
  optimism: {
    chainId: 10,
    chainName: "Optimism",
    chainIcon: "/networks/optimism.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://mainnet.optimism.io",
  },
  bsc: {
    chainId: 56,
    chainName: "BNB Smart Chain",
    chainIcon: "/networks/bsc.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://56.rpc.thirdweb.com",
  },
  polygon: {
    chainId: 137,
    chainName: "Polygon",
    chainIcon: "/networks/polygon.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://polygon.drpc.org",
  },
  ethereum: {
    chainId: 1,
    chainName: "Ethereum",
    chainIcon: "/networks/ethereum.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://0xrpc.io/eth",
  },
  monad: {
    chainId: 143,
    chainName: "Monad",
    chainIcon: "/networks/monad.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.monad.xyz",
  },
  base: {
    chainId: 8453,
    chainName: "Base",
    chainIcon: "/networks/base.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://mainnet.base.org",
  },
  hyperEvm: {
    chainId: 999,
    chainName: "HyperEVM",
    chainIcon: "/networks/hyperevm.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.hyperliquid.xyz/evm",
  },
};

const RPC_ENV_BY_CHAIN_ID: Record<number, string> = {
  42161: "NEXT_PUBLIC_ARBITRUM_RPC_URL",
  10: "NEXT_PUBLIC_OPTIMISM_RPC_URL",
};

export function getEvmFundingNetworks(): FundingNetwork[] {
  return Object.values(FUNDING_NETWORKS).filter(
    (network) => network.chainType === FundingNetworkType.EVM,
  );
}

export function getFundingNetworkByChainId(chainId: number): FundingNetwork | undefined {
  return Object.values(FUNDING_NETWORKS).find((network) => network.chainId === chainId);
}

export function getFundingRpcUrl(chainId: number): string {
  const network = getFundingNetworkByChainId(chainId);

  if (!network) {
    throw new Error(`Unsupported funding chainId: ${chainId}`);
  }

  const envKey = RPC_ENV_BY_CHAIN_ID[chainId];
  const envOverride = envKey ? process.env[envKey]?.trim() : undefined;

  return envOverride || network.defaultRpcUrl;
}
