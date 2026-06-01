import type { QuoteResponse } from "@stableflow/core";

import type { StableflowDepositToken } from "@/lib/funding/stableflow";

export interface ConfidentialSessionView {
  authenticated: boolean;
  eoaAddress?: string;
  intentsUserId?: string;
}

export interface ConfidentialChallengeResponse {
  message: string;
  intentsUserId: string;
}

export interface ConfidentialAuthenticateResponse {
  intentsUserId: string;
}

export interface ConfidentialTokensResponse {
  tokens: StableflowDepositToken[];
  polygonUsdcDestinationAssetId: string;
}

export interface ConfidentialQuoteResponse {
  quote: QuoteResponse;
}

export interface ConfidentialBalanceView {
  balanceBaseUnits: string;
  balance: number;
  usd: number;
}

export interface ConfidentialBalancesResponse {
  usdc: ConfidentialBalanceView;
}

export interface ConfidentialSubmitTxResponse {
  status: string;
}

export interface ConfidentialStatusResponse {
  status: string;
}

export interface ConfidentialGenerateIntentResponse {
  message: string;
  depositAddress: string;
}

export interface ConfidentialSubmitIntentResponse {
  status: string;
}
