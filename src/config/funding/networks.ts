import { getStableflowChainLogo } from "@/utils/logo";
import { fallback, http } from "viem";
import { generateRpcSignature } from "./signature";

export enum FundingNetworkType {
  EVM = "evm",
  SVM = "svm",
  BTC = "btc",
  NEAR = "near",
  TVM = "tvm",
}

export interface FundingNetwork {
  chainId: number;
  chainName: string;
  chainIcon: string;
  chainType: FundingNetworkType;
  defaultRpcUrl: string;
  rpcUrls: string[];
}

export const FUNDING_NETWORKS: Record<string, FundingNetwork> = {
  arbitrum: {
    chainId: 42161,
    chainName: "Arbitrum",
    chainIcon: getStableflowChainLogo("arbitrum"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://arb1.arbitrum.io/rpc",
    rpcUrls: ["https://rpcs.stableflow.ai/rpc/arbitrum", "https://arb1.arbitrum.io/rpc"],
  },
  optimism: {
    chainId: 10,
    chainName: "Optimism",
    chainIcon: getStableflowChainLogo("optimism"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://mainnet.optimism.io",
    rpcUrls: ["https://rpcs.stableflow.ai/rpc/optimism", "https://mainnet.optimism.io"],
  },
  bsc: {
    chainId: 56,
    chainName: "BNB Smart Chain",
    chainIcon: getStableflowChainLogo("bsc"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://56.rpc.thirdweb.com",
    rpcUrls: ["https://rpcs.stableflow.ai/rpc/bsc", "https://56.rpc.thirdweb.com"],
  },
  polygon: {
    chainId: 137,
    chainName: "Polygon",
    chainIcon: getStableflowChainLogo("polygon"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://polygon.drpc.org",
    rpcUrls: ["https://rpcs.stableflow.ai/rpc/polygon", "https://polygon.drpc.org"],
  },
  ethereum: {
    chainId: 1,
    chainName: "Ethereum",
    chainIcon: getStableflowChainLogo("ethereum"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://0xrpc.io/eth",
    rpcUrls: ["https://rpcs.stableflow.ai/rpc/ethereum", "https://0xrpc.io/eth"],
  },
  monad: {
    chainId: 143,
    chainName: "Monad",
    chainIcon: "/networks/monad.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.monad.xyz",
    rpcUrls: ["https://rpc.monad.xyz"],
  },
  base: {
    chainId: 8453,
    chainName: "Base",
    chainIcon: getStableflowChainLogo("base"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://mainnet.base.org",
    rpcUrls: ["https://mainnet.base.org"],
  },
  hyperEvm: {
    chainId: 999,
    chainName: "HyperEVM",
    chainIcon: "/networks/hyperevm.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.hyperliquid.xyz/evm",
    rpcUrls: ["https://rpc.hyperliquid.xyz/evm"],
  },
  abstract: {
    chainId: 2_741,
    chainName: "Abstract",
    chainIcon: "/networks/abstract.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://api.mainnet.abs.xyz",
    rpcUrls: ["https://api.mainnet.abs.xyz"],
  },
  avalanche: {
    chainId: 43_114,
    chainName: "Avalanche",
    chainIcon: getStableflowChainLogo("avalanche"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
  },
  berachain: {
    chainId: 80094,
    chainName: "Berachain",
    chainIcon: getStableflowChainLogo("berachain"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.berachain.com",
    rpcUrls: ["https://rpc.berachain.com"],
  },
  gnosis: {
    chainId: 100,
    chainName: "Gnosis",
    chainIcon: getStableflowChainLogo("gnosis"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.gnosischain.com",
    rpcUrls: ["https://rpc.gnosischain.com"],
  },
  plasma: {
    chainId: 9745,
    chainName: "Plasma",
    chainIcon: getStableflowChainLogo("plasma"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.plasma.to",
    rpcUrls: ["https://rpcs.stableflow.ai/rpc/plasma", "https://rpc.plasma.to"],
  },
  scroll: {
    chainId: 534_352,
    chainName: "Scroll",
    chainIcon: "/networks/scroll.png",
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://rpc.scroll.io",
    rpcUrls: ["https://rpc.scroll.io"],
  },
  xlayer: {
    chainId: 196,
    chainName: "XLayer",
    chainIcon: getStableflowChainLogo("xlayer"),
    chainType: FundingNetworkType.EVM,
    defaultRpcUrl: "https://xlayerrpc.okx.com",
    rpcUrls: ["https://rpcs.stableflow.ai/rpc/xlayer", "https://xlayerrpc.okx.com"],
  },
  near: {
    chainId: 999_999_999,
    chainName: "Near",
    chainIcon: getStableflowChainLogo("near"),
    chainType: FundingNetworkType.NEAR,
    defaultRpcUrl: "https://nearinner.deltarpc.com",
    rpcUrls: ["https://nearinner.deltarpc.com", "https://rpc.mainnet.near.org"],
  },
  tron: {
    chainId: 999_999_998,
    chainName: "Tron",
    chainIcon: getStableflowChainLogo("tron"),
    chainType: FundingNetworkType.TVM,
    defaultRpcUrl: "https://tron-rpc.publicnode.com",
    rpcUrls: ["https://rpcs.stableflow.ai/rpc/tron", "https://tron-rpc.publicnode.com"],
  },
  solana: {
    chainId: 999_999_997,
    chainName: "Solana",
    chainIcon: getStableflowChainLogo("solana"),
    chainType: FundingNetworkType.SVM,
    defaultRpcUrl: "https://solana-rpc.publicnode.com",
    rpcUrls: ["https://rpcs.stableflow.ai/rpc/solana", "https://solana-rpc.publicnode.com"],
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

export function getFundingRpcUrls(chainId: number): { rpcUrls: string[]; networkName: string; } {
  const networkIndex = Object.values(FUNDING_NETWORKS).findIndex((network) => network.chainId === chainId);
  const networkName = Object.keys(FUNDING_NETWORKS)[networkIndex];

  if (!networkName) {
    throw new Error(`Unsupported funding chainId: ${chainId}`);
  }

  const network = FUNDING_NETWORKS[networkName];

  return { rpcUrls: network.rpcUrls, networkName: networkName.toLowerCase() };
}

const SIGNED_RPC_HOST = "rpcs.stableflow.ai";

function isSignedRpcUrl(rpcUrl: string): boolean {
  return rpcUrl.includes(SIGNED_RPC_HOST);
}

export function getSignedRpcHttpConfig(rpcUrl: string, chain: string) {
  if (!isSignedRpcUrl(rpcUrl)) {
    return {};
  }

  return {
    onFetchRequest: (_request: Request, init: RequestInit) => {
      const { headers } = generateRpcSignature(chain);

      return {
        ...init,
        headers: {
          ...(init.headers as Record<string, string> | undefined),
          ...headers,
        },
      };
    },
  };
}

export function getFundingRpcUrlFallback(chainId: number) {
  const networkIndex = Object.values(FUNDING_NETWORKS).findIndex((network) => network.chainId === chainId);
  const networkName = Object.keys(FUNDING_NETWORKS)[networkIndex];

  if (!networkName) {
    throw new Error(`Unsupported funding chainId: ${chainId}`);
  }

  const network = FUNDING_NETWORKS[networkName];

  return fallback(
    network
      .rpcUrls
      .map(
        (rpc) => http(
          rpc,
          getSignedRpcHttpConfig(rpc, networkName.toLowerCase()),
        )
      )
  );
}
