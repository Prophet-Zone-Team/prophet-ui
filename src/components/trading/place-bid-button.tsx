"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { teamTradeHref } from "@/lib/routes/trade";

import { buildBidOrderPreview, type BidOrderPreview } from "@/lib/market/polymarket-order";
import { calculateReferencePrice } from "@/lib/market/order-math";
import { attachUserOrderSignature, buildUserOrderSignablePayload } from "@/lib/market/user-order";
import type { TeamMarketSnapshot, UserOrderPreview, UserTradingReadiness } from "@/types/market";
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
import { getOrCreateQuickBidSessionSigner, signQuickBidOrder } from "@/components/trading/quick-bid-session-signer";
import { useAuthOptional } from "@/context/auth";

type QuickBidStatus = "idle" | "checking" | "submitting" | "success" | "error";

interface TradingConfig {
  builderCode?: string;
  builderTakerFeeRate?: number;
}

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
  const auth = useAuthOptional();
  const [amount, setAmount] = useState(() => readQuickBidAmount());
  const [status, setStatus] = useState<QuickBidStatus>("idle");
  const [message, setMessage] = useState<string>();
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
      showResult("error", "Set a positive Quick Bid amount from the account menu first.");
      return;
    }

    writeQuickBidAmount(String(numericAmount), activeWalletAddress);
    setStatus("checking");
    setMessage(`Checking Quick Bid readiness for ${snapshot.team.name}.`);

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

      const [config, readiness] = await Promise.all([
        fetchJson<TradingConfig>("/api/trading/config"),
        loadReadinessForPreview(preview),
      ]);
      const readinessError = getReadinessError(readiness);

      if (readinessError) {
        throw new Error(readinessError);
      }

      const signer = getOrCreateQuickBidSessionSigner(session.walletAddress);
      const signable = buildUserOrderSignablePayload({
        preview,
        walletAddress: session.walletAddress,
        funderAddress: session.funderAddress,
        orderType: "FAK",
        builderCode: config.builderCode,
      });
      const signature = await signQuickBidOrder(signable, signer);
      const signedOrder = attachUserOrderSignature({
        signable,
        signature,
      });

      setStatus("submitting");
      setMessage(`Submitting ${formatQuickBidAmount(String(numericAmount))} USDC Quick Bid for ${snapshot.team.name} YES.`);

      const payload = await fetchJson<{ order?: { id?: string }; response?: unknown }>("/api/trading/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...signedOrder,
          preview: buildUserOrderPreview(snapshot, preview),
        }),
      });

      showResult(
        "success",
        `Quick Bid submitted for ${snapshot.team.name}${payload.order?.id ? ` / ${payload.order.id}` : ""}.`,
      );
    } catch (error) {
      showResult("error", error instanceof Error ? error.message : String(error));
    }
  }

  function showResult(nextStatus: "success" | "error", nextMessage: string) {
    setStatus(nextStatus);
    setMessage(nextMessage);

    window.setTimeout(() => {
      setStatus("idle");
      setMessage(undefined);
    }, nextStatus === "success" ? 4200 : 6400);
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
    <>
      <button
        type="button"
        className={className}
        disabled={status === "checking" || status === "submitting"}
        onClick={() => void handleClick()}
      >
        {buttonText}
      </button>
      {message ? (
        <div
          className={
            status === "error"
              ? "mt-2 rounded-[7px] border border-prophet-red/30 bg-[rgba(255,240,244,0.95)] px-3 py-2 text-xs text-prophet-red"
              : status === "success"
                ? "mt-2 rounded-[7px] border border-prophet-green/30 bg-[rgba(241,253,248,0.95)] px-3 py-2 text-xs text-prophet-green"
                : "mt-2 rounded-[7px] border border-prophet-line bg-white/90 px-3 py-2 text-xs text-prophet-ink"
          }
        >
          <span>{status === "error" ? "Quick Bid blocked" : status === "success" ? "Quick Bid submitted" : "Quick Bid"}</span>
          <strong>{message}</strong>
          {auth?.session ? (
            <small>
              {auth.session.walletAddress.slice(0, 6)}...{auth.session.walletAddress.slice(-4)}
            </small>
          ) : null}
        </div>
      ) : null}
    </>
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
