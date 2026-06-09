import { getStableflowChainLogo } from "@/utils/logo";

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
    chainIcon: getStableflowChainLogo("arbitrum"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://arb1.arbitrum.io/rpc",
  },
  optimism: {
    chainId: 10,
    chainName: "Optimism",
    chainIcon: getStableflowChainLogo("optimism"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://mainnet.optimism.io",
  },
  bsc: {
    chainId: 56,
    chainName: "BNB Smart Chain",
    chainIcon: getStableflowChainLogo("bsc"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://56.rpc.thirdweb.com",
  },
  polygon: {
    chainId: 137,
    chainName: "Polygon",
    chainIcon: getStableflowChainLogo("polygon"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://polygon.drpc.org",
  },
  ethereum: {
    chainId: 1,
    chainName: "Ethereum",
    chainIcon: getStableflowChainLogo("ethereum"),
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
    chainIcon: getStableflowChainLogo("base"),
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
  abstract: {
    chainId: 2_741,
    chainName: "Abstract",
    chainIcon: "/networks/abstract.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://api.mainnet.abs.xyz",
  },
  avalanche: {
    chainId: 43_114,
    chainName: "Avalanche",
    chainIcon: getStableflowChainLogo("avalanche"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
  },
  berachain: {
    chainId: 80094,
    chainName: "Berachain",
    chainIcon: getStableflowChainLogo("berachain"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.berachain.com",
  },
  gnosis: {
    chainId: 100,
    chainName: "Gnosis",
    chainIcon: getStableflowChainLogo("gnosis"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.gnosischain.com",
  },
  plasma: {
    chainId: 9745,
    chainName: "Plasma",
    chainIcon: getStableflowChainLogo("plasma"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.plasma.to",
  },
  scroll: {
    chainId: 534_352,
    chainName: "Scroll",
    chainIcon: "/networks/scroll.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.scroll.io",
  },
  xlayer: {
    chainId: 196,
    chainName: "XLayer",
    chainIcon: getStableflowChainLogo("xlayer"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://xlayerrpc.okx.com",
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
