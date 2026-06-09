import { QuoteRequest, type QuoteResponse, type TokenResponse } from "@stableflow/core";

import type { FundingAsset } from "@/config/funding/tokens";
import {
  isPolygonNativeUsdcToken,
  mapStableflowTokenToDepositToken,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";

export const STABLEFLOW_POLYGON_USDC_ORIGIN_ASSET_ID =
  "nep245:v2_1.omni.hot.tg:137_qiStmoQJDQPTebaPjgx5VBxZv6L";

export type StableflowWithdrawToken = StableflowDepositToken;

export function buildStableflowWithdrawQuoteRequest({
  destinationAssetId,
  amountBaseUnits,
  refundTo,
  recipient,
  dry = false,
}: {
  destinationAssetId: string;
  amountBaseUnits: string;
  refundTo: string;
  recipient: string;
  dry?: boolean;
}): QuoteRequest {
  return {
    dry,
    swapType: QuoteRequest.swapType.FLEX_INPUT,
    slippageTolerance: 50,
    originAsset: STABLEFLOW_POLYGON_USDC_ORIGIN_ASSET_ID,
    destinationAsset: destinationAssetId,
    amount: amountBaseUnits,
    refundTo,
    refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
    recipient,
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
    deadline: new Date(Date.now() + 3_600_000).toISOString(),
  };
}

export function mapStableflowTokenToWithdrawToken(token: TokenResponse): StableflowWithdrawToken | undefined {
  return mapStableflowTokenToDepositToken(token);
}

export function isStableflowWithdrawToken(
  token: FundingAsset | StableflowWithdrawToken | undefined,
): token is StableflowWithdrawToken {
  return Boolean(token && "assetId" in token);
}

export function isStableflowWithdrawLocalPolygonUsdc(
  token: Pick<StableflowWithdrawToken, "chainId" | "address">,
): boolean {
  return isPolygonNativeUsdcToken(token);
}

export type { QuoteResponse };
