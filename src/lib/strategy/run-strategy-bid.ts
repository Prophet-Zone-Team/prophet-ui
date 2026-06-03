"use client";

import type { BidOrderPreview } from "@/lib/market/polymarket-order";
import { buildSdkSignedUserOrder } from "@/lib/market/sdk-user-order";
import type { SignedUserOrderPayload } from "@/lib/market/user-order";
import { reportTradeOrderTransaction } from "@/lib/portfolio/user";
import type { StrategyBidLeg } from "@/lib/strategy/strategy-bid-validation";
import { TEAM_MARKET_BUY_ORDER_TYPE_EXPORT } from "@/lib/trading/team-market-buy-preview";
import {
  formatOrderToastSummary,
  resolveOrderErrorMessage,
  showOrderErrorToast,
  showOrderSubmittedToast
} from "@/lib/trading/order-toast";
import { postCollateralBalanceSync } from "@/lib/trading/sync-collateral-balance";
import type { TeamMarketSnapshot, TradingUserSession, UserOrderPreview } from "@/types/market";
import {
  buildTeamUserOrderPreview,
  submitSignedTradeOrdersBatch,
  type SubmitBatchOrderResult
} from "@/views/trade/trade-widget/trade-ticket-helpers";

export type SignedStrategyBidLeg = {
  legId: string;
  signedOrder: SignedUserOrderPayload;
  userOrderPreview: UserOrderPreview;
  preview: BidOrderPreview;
  snapshot: TeamMarketSnapshot;
};

export async function signStrategyBidLeg(
  leg: StrategyBidLeg,
  session: TradingUserSession
): Promise<SignedStrategyBidLeg> {
  if (!leg.snapshot || !leg.preview) {
    throw new Error(leg.validation.reason ?? "This leg is not ready for signing.");
  }

  if (!session.funderAddress) {
    throw new Error(
      "A connected wallet, deployed deposit wallet, and Polymarket token are required."
    );
  }

  const signedOrder = await buildSdkSignedUserOrder({
    preview: leg.preview,
    walletAddress: session.walletAddress,
    funderAddress: session.funderAddress,
    orderType: TEAM_MARKET_BUY_ORDER_TYPE_EXPORT
  });

  const userOrderPreview = buildTeamUserOrderPreview(leg.snapshot, leg.preview);

  return {
    legId: leg.id,
    signedOrder,
    userOrderPreview,
    preview: leg.preview,
    snapshot: leg.snapshot
  };
}

export async function submitStrategyBidBatch(
  signedLegs: SignedStrategyBidLeg[]
): Promise<SubmitBatchOrderResult> {
  const result = await submitSignedTradeOrdersBatch({
    orders: signedLegs.map((leg) => ({
      signedOrder: leg.signedOrder,
      userOrderPreview: leg.userOrderPreview
    }))
  });

  for (const [index, batchResult] of result.results.entries()) {
    const leg = signedLegs[index];

    if (!leg || !batchResult.success) {
      continue;
    }

    void reportTradeOrderTransaction({
      userOrderPreview: leg.userOrderPreview,
      result: { order: batchResult.order, submittedAt: result.submittedAt },
      preview: leg.preview,
      variant: "team",
      snapshot: leg.snapshot
    });
  }

  const tokenIds = [...new Set(signedLegs.map((leg) => leg.preview.tokenId).filter(Boolean))];

  await Promise.all(
    tokenIds.map((tokenId) =>
      postCollateralBalanceSync(tokenId as string).catch(() => undefined)
    )
  );

  return result;
}

export function summarizeStrategyBidSubmission(
  result: SubmitBatchOrderResult,
  strategyName: string
) {
  if (result.failureCount === 0) {
    showOrderSubmittedToast(
      `${result.successCount} strategy orders submitted for ${strategyName}.`,
      { onViewPortfolio: () => window.location.assign("/portfolio") }
    );
    return;
  }

  if (result.successCount === 0) {
    showOrderErrorToast("Strategy orders could not be submitted. Review failed legs and try again.");
    return;
  }

  showOrderErrorToast(
    `${result.successCount} orders submitted, ${result.failureCount} failed. Review failed legs and try again.`
  );
}

export function resolveStrategyBidSignError(error: unknown): string {
  return resolveOrderErrorMessage(error);
}
