"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  fetchJson,
  getQuickBidSetupIssue,
} from "@/components/trading/quick-bid-account-setup";
import {
  formatQuickBidAmount,
  readActiveQuickBidWalletAddress,
  readQuickBidAmount,
  subscribeQuickBidAmountChange,
  writeQuickBidAmount,
} from "@/components/trading/quick-bid-amount";
import { getOrCreateQuickBidSessionSigner } from "@/components/trading/quick-bid-session-signer";
import { useAuthOptional } from "@/context/auth";
import { buildBidOrderPreview, type BidOrderPreview } from "@/lib/market/polymarket-order";
import { calculateReferencePrice } from "@/lib/market/order-math";
import { teamTradeHref } from "@/lib/routes/trade";
import {
  formatOrderToastSummary,
  showOrderErrorToast,
  showOrderSubmittedToast
} from "@/lib/trading/order-toast";
import { createLocalClobWalletClient } from "@/lib/trading/viem-clob-signer";
import type { TeamMarketSnapshot, UserOrderPreview, UserTradingReadiness } from "@/types/market";
import { submitSignedTradeOrder } from "@/views/trade/trade-widget/trade-ticket-helpers";

type QuickBidStatus = "idle" | "checking" | "submitting";

interface PlaceBidButtonProps {
  children?: ReactNode;
  className?: string;
  snapshot?: TeamMarketSnapshot;
  teamName?: string;
  /** When set with a snapshot, navigates to the trade page instead of submitting inline. */
  navigateToTrade?: boolean;
}

export function PlaceBidButton({
  children = "Quick Bid",
  className = "inline-flex h-9 min-w-[86px] items-center justify-center rounded-[7px] bg-gradient-to-br from-[#0d69ff] to-[#124cf0] text-xs font-extrabold text-white shadow-[0_10px_22px_rgba(18,82,246,0.22)] disabled:cursor-wait disabled:opacity-70",
  snapshot,
  navigateToTrade = false
}: PlaceBidButtonProps) {
  const router = useRouter();
  const auth = useAuthOptional();
  const [amount, setAmount] = useState(() => readQuickBidAmount());
  const [status, setStatus] = useState<QuickBidStatus>("idle");
  const shouldShowAmount = isQuickBidLabel(children);
  const buttonText = useMemo(() => {
    if (status === "checking") {
      return "Checking";
    }

    if (status === "submitting") {
      return "Submitting";
    }

    return shouldShowAmount ? `Quick Bid(${formatQuickBidAmount(amount)})` : children;
  }, [amount, children, shouldShowAmount, status]);

  useEffect(() => {
    const unsubscribe = subscribeQuickBidAmountChange(() => {
      setAmount(readQuickBidAmount());
    });

    setAmount(readQuickBidAmount());

    return unsubscribe;
  }, []);

  async function handleClick() {
    if (!snapshot) {
      window.location.assign("/");
      return;
    }

    await runQuickBid();
  }

  async function runQuickBid() {
    if (!snapshot || status === "checking" || status === "submitting") {
      return;
    }

    const activeWalletAddress = readActiveQuickBidWalletAddress();
    const numericAmount = Number(readQuickBidAmount(activeWalletAddress));

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      showOrderErrorToast("Set a positive Quick Bid amount from the account menu first.");
      return;
    }

    writeQuickBidAmount(String(numericAmount), activeWalletAddress);
    setStatus("checking");

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

      const preview = buildQuickBidPreview(snapshot, numericAmount);

      if (!preview.canSubmitRealOrder) {
        throw new Error(preview.disabledReason ?? "This market is not available for real orders.");
      }

      const readiness = await loadReadinessForPreview(preview);
      const readinessError = getReadinessError(readiness);

      if (readinessError) {
        throw new Error(readinessError);
      }

      const sessionSigner = getOrCreateQuickBidSessionSigner(session.walletAddress);
      setStatus("submitting");

      const result = await submitSignedTradeOrder({
        session,
        preview,
        orderType: "FAK",
        userOrderPreview: buildUserOrderPreview(snapshot, preview),
        signer: createLocalClobWalletClient(sessionSigner.privateKey),
      });

      showOrderSubmittedToast(
        formatOrderToastSummary({
          tradeSide: preview.tradeSide,
          outcomeSide: preview.outcomeSide,
          estimatedTotalCost: preview.estimatedTotalCost,
          shareSize: preview.shareSize,
          variant: "team",
          teamName: snapshot.team.name,
        }),
        {
          orderId: result.order?.id,
          onViewPortfolio: () => router.push("/portfolio"),
        }
      );
      setStatus("idle");
    } catch (error) {
      setStatus("idle");
      showOrderErrorToast(error);
    }
  }

  if (navigateToTrade && snapshot) {
    return (
      <Link
        href={`${teamTradeHref(snapshot.team.id)}#trade`}
        className={className}
        aria-label={
          typeof children === "string"
            ? `${children} for ${snapshot.team.name}`
            : `Open trade for ${snapshot.team.name}`
        }
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={status === "checking" || status === "submitting"}
      onClick={() => void handleClick()}
    >
      {buttonText}
    </button>
  );
}

async function loadReadinessForPreview(preview: BidOrderPreview) {
  const query = new URLSearchParams({
    tradeSide: "buy",
    cost: String(preview.estimatedCost),
    size: String(preview.shareSize),
    totalCost: String(preview.estimatedTotalCost),
    estimatedTakerFee: String(preview.estimatedTakerFee),
  });

  if (preview.tokenId) {
    query.set("tokenId", preview.tokenId);
  }

  return fetchJson<UserTradingReadiness>(`/api/trading/readiness?${query.toString()}`);
}

function buildQuickBidPreview(snapshot: TeamMarketSnapshot, amount: number) {
  return buildBidOrderPreview({
    snapshot,
    outcomeSide: "yes",
    tradeSide: "buy",
    amount,
    limitPrice: snapshot.market.polymarket?.tokens.yes?.price ?? calculateReferencePrice(snapshot.market.probability, "yes"),
    orderType: "FAK",
  });
}

function buildUserOrderPreview(snapshot: TeamMarketSnapshot, preview: BidOrderPreview): UserOrderPreview {
  if (!preview.tokenId) {
    throw new Error("A Polymarket token ID is required before submitting a real order.");
  }

  return {
    marketId: snapshot.market.polymarket?.marketId ?? snapshot.market.polymarket?.conditionId,
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
    warnings: preview.disabledReason ? [preview.disabledReason] : [],
  };
}

function getReadinessError(readiness: UserTradingReadiness) {
  const failed = readiness.checks.find((check) => check.status === "fail");

  if (!failed) {
    return undefined;
  }

  return `${failed.label}: ${failed.detail}`;
}

function isQuickBidLabel(children: ReactNode) {
  return typeof children === "string" && children.trim().toLowerCase() === "quick bid";
}
