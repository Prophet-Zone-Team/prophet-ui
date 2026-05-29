export type ConfidentialAuthStatus = "authenticated" | "needs_signature" | "expired";

export type ConfidentialAccountStatus = "not_created" | "empty" | "funded";

export interface ConfidentialBalanceEntry {
  tokenId: string;
  available: string;
  source?: string;
}

export interface ConfidentialAccountResponse {
  walletAddress: string;
  privateAccountAddress: string;
  authStatus: ConfidentialAuthStatus;
  accountStatus: ConfidentialAccountStatus;
  updatedAt: string;
}

export interface ConfidentialBalancesResponse {
  walletAddress: string;
  privateAccountAddress: string;
  balances: ConfidentialBalanceEntry[];
  usdcBalance: string;
  usdcBalanceFormatted: string;
  privateBalanceUsd: number;
  updatedAt: string;
}

export interface ConfidentialQuoteResponse {
  depositAddress: string;
  depositMemo?: string;
  quote: unknown;
}

export interface ConfidentialIntentPayloadResponse {
  intent: unknown;
  standard: string;
}

export interface ConfidentialOperationStatusResponse {
  status: string;
  depositAddress: string;
}

export type ConfidentialOperationMode = "shield" | "unshield";

export interface ConfidentialAuthMessageResponse {
  walletAddress: string;
  privateAccountAddress: string;
  message: unknown;
  chainType: "evm";
}
