import { FUNDING_NETWORKS } from "@/config/funding";

/** Default deposit token order while balances are still loading. */
export const DEFAULT_DEPOSIT_TOKEN_ORDER: ReadonlyArray<{
  chainId: number;
  symbol: string;
}> = [
  { chainId: FUNDING_NETWORKS.polygon.chainId, symbol: "USDC" },
  { chainId: FUNDING_NETWORKS.polygon.chainId, symbol: "USDC.e" },
  { chainId: FUNDING_NETWORKS.polygon.chainId, symbol: "USDT" },
  { chainId: FUNDING_NETWORKS.polygon.chainId, symbol: "USDT0" },
  { chainId: FUNDING_NETWORKS.ethereum.chainId, symbol: "USDC" },
  { chainId: FUNDING_NETWORKS.ethereum.chainId, symbol: "USDT" },
  { chainId: FUNDING_NETWORKS.arbitrum.chainId, symbol: "USDC" },
  { chainId: FUNDING_NETWORKS.arbitrum.chainId, symbol: "USDT" },
  { chainId: FUNDING_NETWORKS.optimism.chainId, symbol: "USDC" },
  { chainId: FUNDING_NETWORKS.optimism.chainId, symbol: "USDT" },
  { chainId: FUNDING_NETWORKS.optimism.chainId, symbol: "USD₮0" },
  { chainId: FUNDING_NETWORKS.bsc.chainId, symbol: "USDC" },
  { chainId: FUNDING_NETWORKS.bsc.chainId, symbol: "USDT" },
];

export const MOCK_CONNECTED_BALANCE_USD = 0;

export const DEPOSIT_MODAL_WIDTH = {
  entry: "w-[472px]",
  step: "w-[500px]"
} as const;

export const DEPOSIT_ENTRY_MODAL_MIN_HEIGHT = {
  crypto: "min-h-[388px]",
  privateBalance: "min-h-[603px]",
  privateBalanceNotCreated: "min-h-[670px]",
} as const;
