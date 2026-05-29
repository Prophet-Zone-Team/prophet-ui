import type { FundingAsset } from "@/config/funding";

export type PrivateTopupStep = "tokens" | "amount" | "confirm" | "status";

export type PrivateTopupSelectableToken = FundingAsset & {
  assetId: string;
  blockchain: string;
  price: number;
};

export type PrivateTopupStatusPhase =
  | "preparing"
  | "transferring"
  | "signing"
  | "shielding"
  | "refreshing"
  | "success"
  | "error";

export interface PrivateTopupAmountState {
  amountUsd: string;
  tokenAmount: string;
}

export interface PrivateShieldExecutionContext {
  depositAddress: string;
  depositMemo?: string;
  txHash?: string;
}
