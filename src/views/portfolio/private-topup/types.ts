import type { QuoteResponse } from "@stableflow/core";

import type { StableflowDepositToken } from "@/lib/funding/stableflow";
import type {
  DepositStatusPhase,
  StableflowDepositContext,
} from "@/views/portfolio/deposit/types";

export type PrivateTopupStep = "tokens" | "amount" | "confirm" | "status";

export type PrivateTopupSelectableToken = StableflowDepositToken;

export type { DepositStatusPhase, StableflowDepositContext };

export interface PrivateTopupAmountState {
  amountUsd: string;
  tokenAmount: string;
}

export interface PrivateTopupDialogState {
  step: PrivateTopupStep;
  selectedToken?: PrivateTopupSelectableToken;
  amount: PrivateTopupAmountState;
  stableflowQuote?: QuoteResponse;
  stableflowExecution?: StableflowDepositContext;
}
