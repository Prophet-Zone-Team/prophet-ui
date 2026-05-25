"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { fetchJson, getQuickBidSetupIssue } from "@/components/trading/quick-bid-account-setup";
import { getOrCreateQuickBidSessionSigner } from "@/components/trading/quick-bid-session-signer";
import type { AuthContextValue } from "@/context/auth/auth-context";
import { buildBidOrderPreview, type BidOrderPreview } from "@/lib/market/polymarket-order";
import { calculateReferencePrice } from "@/lib/market/order-math";
import {
  formatOrderToastSummary,
  showOrderErrorToast,
  showOrderSubmittedToast
} from "@/lib/trading/order-toast";
import { createLocalClobWalletClient } from "@/lib/trading/viem-clob-signer";
import type { TeamMarketSnapshot, UserOrderPreview, UserTradingReadiness } from "@/types/market";
import { submitSignedTradeOrder } from "@/views/trade/trade-widget/trade-ticket-helpers";

export type FastBidStatus = "idle" | "checking" | "submitting";

export interface RunFastBidOptions {
  snapshot: TeamMarketSnapshot;
  amount: number;
  auth: AuthContextValue | undefined;
  router: AppRouterInstance;
  onStatusChange?: (status: FastBidStatus) => void;
}

export async function runFastBid({
  snapshot,
  amount,
  auth,
  router,
  onStatusChange
}: RunFastBidOptions): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) {
    showOrderErrorToast(
      "Set a positive Fast Bid amount from the account menu first."
    );
    return;
  }

  onStatusChange?.("checking");

  try {
    let session = auth?.session;

    if (!auth?.isAuthenticated || !session) {
      const loginResult = await auth?.openLogin();
      session = loginResult?.session;
    }

    const setupIssue = await getQuickBidSetupIssue(session);

    if (setupIssue) {
      throw new Error(setupIssue);
    }

    if (!session?.funderAddress) {
      throw new Error("Trading session is missing a Polymarket deposit wallet.");
    }

    const preview = buildFastBidPreview(snapshot, amount);

    if (!preview.canSubmitRealOrder) {
      throw new Error(
        preview.disabledReason ?? "This market is not available for real orders."
      );
    }

    const readiness = await loadReadinessForPreview(preview);
    const readinessError = getReadinessError(readiness);

    if (readinessError) {
      throw new Error(readinessError);
    }

    const sessionSigner = getOrCreateQuickBidSessionSigner(session.walletAddress);
    onStatusChange?.("submitting");

    const result = await submitSignedTradeOrder({
      session,
      preview,
      orderType: "FAK",
      userOrderPreview: buildUserOrderPreview(snapshot, preview),
      signer: createLocalClobWalletClient(sessionSigner.privateKey)
    });

    showOrderSubmittedToast(
      formatOrderToastSummary({
        tradeSide: preview.tradeSide,
        outcomeSide: preview.outcomeSide,
        estimatedTotalCost: preview.estimatedTotalCost,
        shareSize: preview.shareSize,
        variant: "team",
        teamName: snapshot.team.name
      }),
      {
        orderId: result.order?.id,
        onViewPortfolio: () => router.push("/portfolio")
      }
    );
    onStatusChange?.("idle");
  } catch (error) {
    onStatusChange?.("idle");
    showOrderErrorToast(error);
  }
}

async function loadReadinessForPreview(preview: BidOrderPreview) {
  const query = new URLSearchParams({
    tradeSide: "buy",
    cost: String(preview.estimatedCost),
    size: String(preview.shareSize),
    totalCost: String(preview.estimatedTotalCost),
    estimatedTakerFee: String(preview.estimatedTakerFee)
  });

  if (preview.tokenId) {
    query.set("tokenId", preview.tokenId);
  }

  return fetchJson<UserTradingReadiness>(`/api/trading/readiness?${query.toString()}`);
}

export function buildFastBidPreview(snapshot: TeamMarketSnapshot, amount: number) {
  return buildBidOrderPreview({
    snapshot,
    outcomeSide: "yes",
    tradeSide: "buy",
    amount,
    limitPrice:
      snapshot.market.polymarket?.tokens.yes?.price ??
      calculateReferencePrice(snapshot.market.probability, "yes"),
    orderType: "FAK"
  });
}

function buildUserOrderPreview(
  snapshot: TeamMarketSnapshot,
  preview: BidOrderPreview
): UserOrderPreview {
  if (!preview.tokenId) {
    throw new Error("A Polymarket token ID is required before submitting a real order.");
  }

  return {
    marketId:
      snapshot.market.polymarket?.marketId ?? snapshot.market.polymarket?.conditionId,
    tokenId: preview.tokenId,
    teamId: snapshot.team.id,
    outcome: preview.outcomeSide,
    side: preview.tradeSide,
    orderType: "FAK",
    limitPrice: preview.sidePrice,
    size: preview.shareSize,
    estimatedCost: preview.estimatedCost,
    estimatedTakerFee: preview.estimatedTakerFee,
    estimatedTotalCost: preview.estimatedTotalCost,
    potentialOutcome: preview.potentialOutcome,
    tickSize: preview.tickSize ?? "0.01",
    negRisk: preview.negRisk,
    stale: false,
    warnings: preview.disabledReason ? [preview.disabledReason] : []
  };
}

function getReadinessError(readiness: UserTradingReadiness) {
  const failed = readiness.checks.find((check) => check.status === "fail");

  if (!failed) {
    return undefined;
  }

  return `${failed.label}: ${failed.detail}`;
}
