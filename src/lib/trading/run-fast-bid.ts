"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { AuthContextValue } from "@/context/auth/auth-context";
import {
  formatOrderToastSummary,
  resolveOrderErrorMessage,
  showOrderErrorToast,
  showOrderSubmittedToast
} from "@/lib/trading/order-toast";
import { postCollateralBalanceSync } from "@/lib/trading/sync-collateral-balance";
import {
  buildReportTransactionMarketFromTeam,
  reportTradeOrderTransaction
} from "@/service/user";
import {
  resolveTradePrimaryAction,
  runTradePrimaryAction
} from "@/lib/trading/trade-primary-action";
import { useAuthStore } from "@/store/auth-store";
import type { TeamMarketSnapshot } from "@/types/market";
import {
  buildTeamTradePreview,
  buildTeamUserOrderPreview,
  ensureTradingReadyForBid,
  fetchReadinessForPreview,
  getTeamDefaultLimitPrice,
  submitSignedTradeOrder
} from "@/views/trade/trade-widget/trade-ticket-helpers";

export type FastBidStatus = "idle" | "checking" | "submitting";

const FAST_BID_OUTCOME_SIDE = "yes" as const;
const FAST_BID_TRADE_SIDE = "buy" as const;
const FAST_BID_ORDER_TYPE = "FAK" as const;

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

  if (!auth) {
    showOrderErrorToast("Connect your wallet to continue.");
    return;
  }

  if (auth.isRegionBlocked) {
    return;
  }

  onStatusChange?.("checking");

  try {
    const preview = buildFastBidPreview(snapshot, amount);
    const orderReadiness = await fetchReadinessForPreview(
      preview,
      FAST_BID_TRADE_SIDE,
      auth.readiness
    );
    const session = resolveTradingSession(auth.session);
    const primaryAction = resolveTradePrimaryAction({
      isAuthenticated: auth.isAuthenticated,
      session,
      orderReadiness,
      authReadiness: auth.readiness,
      tradeSide: FAST_BID_TRADE_SIDE,
      submitLabel: "Bid",
      previewCanSubmit: preview.canSubmitRealOrder,
      previewDisabledReason: preview.disabledReason,
      isRegionBlocked: auth.isRegionBlocked,
      eligibilityNetworkError:
        session?.eligibilityStatus === "error" &&
        Boolean(
          session.eligibilityReason?.toLowerCase().includes("timeout") ||
          session.eligibilityReason?.toLowerCase().includes("network")
        )
    });

    if (primaryAction.kind !== "submit") {
      if (
        primaryAction.kind === "market_blocked" ||
        primaryAction.kind === "eligibility_blocked"
      ) {
        showOrderErrorToast(
          primaryAction.hint ?? "Trading is not ready for this order."
        );
      } else {
        await runTradePrimaryAction(primaryAction, {
          tokenId: preview.tokenId,
          openLogin: () => auth.openLogin(),
          signClobCredentials: () => auth.signClobCredentials(),
          signTokenApprovals: () => auth.signTokenApprovals(),
          refreshSetupReadiness: () => auth.refreshSetupReadiness()
        });
      }

      onStatusChange?.("idle");
      return;
    }

    const gate = await ensureTradingReadyForBid({
      session,
      authReadiness: auth.readiness,
      orderReadiness,
      previewCanSubmit: preview.canSubmitRealOrder,
      previewDisabledReason: preview.disabledReason,
      isRegionBlocked: auth.isRegionBlocked,
      openLogin: () => auth.openLogin(),
      signClobCredentials: () => auth.signClobCredentials(),
      signTokenApprovals: () => auth.signTokenApprovals(),
      refreshSetupReadiness: () => auth.refreshSetupReadiness()
    });

    if (!gate.ok) {
      if (gate.action === "show_error" || gate.action === "retry_eligibility") {
        showOrderErrorToast(gate.message);
      }

      onStatusChange?.("idle");
      return;
    }

    if (!session?.funderAddress || !preview.tokenId) {
      throw new Error(
        "A connected wallet, deployed deposit wallet, and Polymarket token are required."
      );
    }

    onStatusChange?.("submitting");

    const userOrderPreview = buildTeamUserOrderPreview(snapshot, preview);

    const result = await submitSignedTradeOrder({
      session,
      preview,
      orderType: FAST_BID_ORDER_TYPE,
      userOrderPreview
    });

    void reportTradeOrderTransaction({
      userOrderPreview,
      result,
      market: buildReportTransactionMarketFromTeam(snapshot, preview)
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

    await postCollateralBalanceSync(preview.tokenId).catch(() => undefined);
    await auth.refreshSetupReadiness();
    onStatusChange?.("idle");
  } catch (error) {
    onStatusChange?.("idle");
    showOrderErrorToast(resolveOrderErrorMessage(error));
  }
}

export function buildFastBidPreview(snapshot: TeamMarketSnapshot, amount: number) {
  return buildTeamTradePreview({
    snapshot,
    outcomeSide: FAST_BID_OUTCOME_SIDE,
    tradeSide: FAST_BID_TRADE_SIDE,
    amount,
    limitPrice: getTeamDefaultLimitPrice(
      snapshot,
      FAST_BID_OUTCOME_SIDE,
      FAST_BID_TRADE_SIDE
    ),
    orderType: FAST_BID_ORDER_TYPE
  });
}

export function isTeamFastBidReady(
  snapshot: TeamMarketSnapshot,
  amount: number
): boolean {
  if (!Number.isFinite(amount) || amount <= 0) {
    return false;
  }

  return buildFastBidPreview(snapshot, amount).canSubmitRealOrder;
}

function resolveTradingSession(fallback?: AuthContextValue["session"]) {
  return useAuthStore.getState().session ?? fallback;
}
