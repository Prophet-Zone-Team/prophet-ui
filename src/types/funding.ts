import type { DepositWalletBatchSignablePayload } from "@/lib/market/deposit-wallet-batch";
import type { UserPositionRecord } from "@/types/market";

export type FundingLoadStatus = "idle" | "loading" | "ready" | "error";

export type BridgeFlowStatus = "idle" | "preparing" | "awaiting_wallet" | "polling" | "syncing" | "success" | "error";

export type BridgeAggregateStatus = "pending" | "completed" | "failed";

export interface CashBalanceView {
  available?: number;
  allowance?: number;
  clobAvailable?: number;
  clobAllowance?: number;
  onchainAvailable?: number;
  onchainAllowance?: number;
  balanceSource?: "clob" | "onchain" | "mixed";
  updatedAt: string;
}

export interface PositionsSummary {
  totalValueUsd: number;
  totalCashPnlUsd: number;
  count: number;
}

export interface PositionsView {
  items: UserPositionRecord[];
  summary: PositionsSummary;
  updatedAt: string;
}

export interface BridgeAddressSet {
  evm?: string;
  svm?: string;
  btc?: string;
  tvm?: string;
}

export interface BridgeDepositAddressResponse {
  address: BridgeAddressSet;
  note?: string;
}

export interface BridgeWithdrawParams {
  toChainId: string;
  toTokenAddress: string;
  recipientAddr: string;
}

export interface BridgeTransactionRecord {
  fromChainId?: string;
  fromTokenAddress?: string;
  fromAmountBaseUnit?: string;
  toChainId?: string;
  toTokenAddress?: string;
  status?: string;
  txHash?: string;
  createdTimeMs?: number;
}

export interface BridgeStatusResponse {
  transactions?: BridgeTransactionRecord[];
}

export interface DepositMetadata {
  chainId: number;
  collateralToken: string;
}

export interface DepositAddressesPayload {
  deposit: BridgeDepositAddressResponse;
  funderAddress: string;
  chainId: number;
  collateralToken: string;
}

export interface WithdrawPreparePayload {
  withdrawal: BridgeDepositAddressResponse;
  transfer: DepositWalletBatchSignablePayload;
  funderAddress: string;
}

export interface SupportedAsset {
  chainId: string;
  chainName: string;
  token: {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
  };
  minCheckoutUsd: number;
}

export interface SupportedAssetsPayload {
  note: string;
  supportedAssets: SupportedAsset[];
}

export interface BridgeQuoteFeeBreakdown {
  gasUsd: number;
  appFeeLabel?: string;
  appFeePercent?: number;
  appFeeUsd?: number;
  fillCostPercent?: number;
  fillCostUsd?: number;
  maxSlippage?: number;
  minReceived?: number;
  swapImpact?: number;
  swapImpactUsd?: number;
  totalImpact?: number;
  totalImpactUsd?: number;
}

export interface BridgeQuoteRequest {
  fromAmountBaseUnit: string;
  fromChainId: string;
  fromTokenAddress: string;
  recipientAddress: string;
  toChainId: string;
  toTokenAddress: string;
}

export interface BridgeQuoteResponse {
  estCheckoutTimeMs: number;
  estInputUsd: number;
  estOutputUsd: number;
  estToTokenBaseUnit: string;
  quoteId: string;
  estFeeBreakdown: BridgeQuoteFeeBreakdown;
}

/** chainId string -> token address (lowercase) -> decimal balance string */
export type EvmBalancesByChain = Record<string, Record<string, string>>;

export interface EvmBalancesSnapshot {
  byChain: EvmBalancesByChain;
  updatedAt?: string;
  error?: string;
}

/** symbol -> USD price string */
export type TokenPricesBySymbol = Record<string, string>;

export interface TokenPriceApiResponse {
  code: number;
  data: TokenPricesBySymbol;
}

export interface CreateDepositAddressesPayload {
  note: string;
  address: {
    evm: string;
    svm: string;
    tron: string;
    btc: string;
  };
  warnings?: { code: string; message: string; }[];
}
