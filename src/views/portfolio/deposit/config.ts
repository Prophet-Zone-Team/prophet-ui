import type { DepositTokenOption } from "@/views/portfolio/deposit/types";

export const DEPOSIT_RECEIVE_ASSET = {
  symbol: "USDC (Prophet)",
  chainLabel: "Polygon"
} as const;

export const MOCK_CONNECTED_BALANCE_USD = 81.35;

export const MOCK_DEPOSIT_TOKENS: DepositTokenOption[] = [
  {
    id: "usdt-eth",
    symbol: "USDT",
    chainLabel: "Ethereum",
    balance: 120.35,
    balanceUsd: 120.35
  },
  {
    id: "eth-eth",
    symbol: "ETH",
    chainLabel: "Ethereum",
    balance: 0.0297,
    balanceUsd: 69.93
  },
  {
    id: "usdt-avax",
    symbol: "USDT",
    chainLabel: "Avalanche",
    balance: 20.35,
    balanceUsd: 20.35
  },
  {
    id: "usdt-op",
    symbol: "USDT",
    chainLabel: "Optimism",
    balance: 12.76,
    balanceUsd: 12.78
  },
  {
    id: "usdt-bnb",
    symbol: "USDT",
    chainLabel: "BNB Chain",
    balance: 0.0378,
    balanceUsd: 2.49
  },
  {
    id: "tron-tron",
    symbol: "TRON",
    chainLabel: "TRON",
    balance: 4.9633,
    balanceUsd: 2.49,
    unsupported: true
  }
];

export const MOCK_TRANSACTION_BREAKDOWN = {
  networkCost: 0.12,
  priceImpactPercent: 0.86,
  maxSlippagePercent: 2.0,
  estimatedTime: "< 1 min"
} as const;

export const DEPOSIT_MODAL_WIDTH = {
  entry: "w-[472px]",
  step: "w-[500px]"
} as const;
