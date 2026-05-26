import type { QuoteResponse } from "@stableflow/core";

import type { FundingAsset } from "@/config/funding";
import type { StableflowDepositToken } from "@/lib/funding/stableflow";

export type DepositMethod = "connected" | "stableflow";

export type DepositStep = "entry" | "tokens" | "amount" | "confirm" | "status";

export type DepositStatusPhase =
  | "bridging"
  | "awaiting_funds"
  | "ready"
  | "converting"
  | "success"
  | "error";

export type { PendingDepositConvertMode } from "@/lib/trading/deposit-wallet-convert";

export type DepositSelectableToken = FundingAsset | StableflowDepositToken;

export interface DepositAmountState {
  amountUsd: string;
  tokenAmount: string;
}

export interface DepositTokenOption {
  id: string;
  symbol: string;
  chainLabel: string;
  balance: number;
  balanceUsd: number;
  unsupported?: boolean;
}

export interface DepositFlowState {
  step: DepositStep;
  selectedToken: DepositTokenOption | undefined;
  amount: number;
}

/** Reserved for a future phase when wiring real bridge execution. */
export interface DepositExecuteContext {
  token: DepositTokenOption;
  amount: number;
  walletAddress: string;
}

export interface StableflowDepositContext {
  quote?: QuoteResponse;
  depositAddress?: string;
  depositMemo?: string;
  txHash?: string;
  skipBridgePoll?: boolean;
  expectedAmountBaseUnits: string;
}

export function isStableflowDepositToken(
  token: DepositSelectableToken | undefined,
): token is StableflowDepositToken {
  return Boolean(token && "assetId" in token);
}
