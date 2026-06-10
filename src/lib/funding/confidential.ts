/**
 * Confidential Intents share the 1Click quote shape but add the
 * `CONFIDENTIAL_INTENTS` account type, which the installed SDK enum does not
 * include. These helpers build the request body with raw string values.
 */

export const CONFIDENTIAL_ACCOUNT_TYPE = "CONFIDENTIAL_INTENTS" as const;
export const ORIGIN_CHAIN_ACCOUNT_TYPE = "ORIGIN_CHAIN" as const;
export const DESTINATION_CHAIN_ACCOUNT_TYPE = "DESTINATION_CHAIN" as const;

/** Default slippage tolerance for confidential operations (1% = 100 bps). */
export const CONFIDENTIAL_SLIPPAGE_BPS = 100;

/** Quote deadline window (5 minutes). */
export const CONFIDENTIAL_QUOTE_DEADLINE_MS = 5 * 60_000;

export type ConfidentialAccountType =
  | "ORIGIN_CHAIN"
  | "INTENTS"
  | "CONFIDENTIAL_INTENTS"
  | "DESTINATION_CHAIN";

export interface ConfidentialQuoteRequest {
  dry: boolean;
  swapType: "EXACT_INPUT";
  slippageTolerance: number;
  originAsset: string;
  destinationAsset: string;
  amount: string;
  deadline: string;
  depositType: ConfidentialAccountType;
  recipientType: ConfidentialAccountType;
  refundType: ConfidentialAccountType;
  refundTo: string;
  recipient: string;
  quoteWaitingTimeMs: number;
}

function quoteDeadline(): string {
  return new Date(Date.now() + CONFIDENTIAL_QUOTE_DEADLINE_MS).toISOString();
}

/**
 * Top up: external EVM funds (origin chain) swapped/moved into the user's
 * Confidential account. originAsset may differ from destinationAsset (a swap).
 */
export function buildConfidentialTopupQuoteRequest({
  originAssetId,
  destinationAssetId,
  amountBaseUnits,
  refundTo,
  recipient,
}: {
  originAssetId: string;
  destinationAssetId: string;
  amountBaseUnits: string;
  refundTo: string;
  recipient: string;
}): ConfidentialQuoteRequest {
  return {
    dry: false,
    swapType: "EXACT_INPUT",
    slippageTolerance: CONFIDENTIAL_SLIPPAGE_BPS,
    originAsset: originAssetId,
    destinationAsset: destinationAssetId,
    amount: amountBaseUnits,
    deadline: quoteDeadline(),
    depositType: ORIGIN_CHAIN_ACCOUNT_TYPE,
    recipientType: CONFIDENTIAL_ACCOUNT_TYPE,
    refundType: ORIGIN_CHAIN_ACCOUNT_TYPE,
    refundTo,
    recipient,
    quoteWaitingTimeMs: 0,
  };
}

/**
 * Unshield: move funds out of the Confidential account onto the destination
 * chain (e.g. Polygon USDC to the Polymarket funder address).
 */
export function buildConfidentialWithdrawQuoteRequest({
  originAssetId,
  destinationAssetId,
  amountBaseUnits,
  refundTo,
  recipient,
}: {
  originAssetId: string;
  destinationAssetId: string;
  amountBaseUnits: string;
  refundTo: string;
  recipient: string;
}): ConfidentialQuoteRequest {
  return {
    dry: false,
    swapType: "EXACT_INPUT",
    slippageTolerance: CONFIDENTIAL_SLIPPAGE_BPS,
    originAsset: originAssetId,
    destinationAsset: destinationAssetId,
    amount: amountBaseUnits,
    deadline: quoteDeadline(),
    depositType: CONFIDENTIAL_ACCOUNT_TYPE,
    recipientType: DESTINATION_CHAIN_ACCOUNT_TYPE,
    refundType: CONFIDENTIAL_ACCOUNT_TYPE,
    refundTo,
    recipient,
    quoteWaitingTimeMs: 0,
  };
}
