"use client";

import { toast } from "sonner";

import { formatShareSize } from "@/lib/market/order-math";
import { formatSharePrice } from "@/lib/portfolio/portfolio-format";
import { formatOrderFundingFailureMessage } from "@/lib/trading/order-funding-check";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import { FetchJsonError } from "@/lib/team/client-fetch";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { getRuntimeTranslator } from "@/lib/i18n/runtime-messages";
import { translateTradeMessage } from "@/views/trade/trade-widget/trade-i18n";
import type {
  BidTradeSide,
  OrderOutcomeSide,
  UserOrderFundingCheck
} from "@/types/market";

export interface OrderToastSummaryInput {
  tradeSide: BidTradeSide;
  outcomeSide: OrderOutcomeSide;
  estimatedTotalCost: number;
  shareSize: number;
  variant?: "team" | "game";
  teamName?: string;
}

export function formatOrderToastSummary(input: OrderToastSummaryInput): string {
  const t = getRuntimeTranslator("toast");
  const tTrade = getRuntimeTranslator("trade");
  const outcomeLabel = input.outcomeSide === "yes" ? tTrade("yes") : tTrade("no");
  const prefix = input.teamName ? `${input.teamName} · ` : "";

  if (input.tradeSide === "sell") {
    return `${prefix}${t("sellShares", {
      outcome: outcomeLabel,
      shares: formatShareSize(input.shareSize)
    })}`;
  }

  const buyVerb =
    input.variant === "team" ? t("bidFor") : tTrade("buy");

  return `${prefix}${t("buyOutcome", {
    verb: buyVerb,
    outcome: outcomeLabel,
    cost: formatTeamDetailMoney(input.estimatedTotalCost)
  })}`;
}

export function resolveOrderErrorMessage(error: unknown): string {
  const t = getRuntimeTranslator("common");

  if (isUserRejectedRequest(error)) {
    return t("signatureCancelled");
  }

  const funding = extractOrderFundingFromError(error);
  if (funding) {
    const fundingMessage = formatOrderFundingFailureMessage(funding);
    if (fundingMessage) {
      return translateTradeMessage(
        fundingMessage,
        getRuntimeTranslator("trade")
      );
    }
  }

  const message = error instanceof Error ? error.message : String(error);

  if (isWalletRejectionMessage(message)) {
    return t("signatureCancelled");
  }

  return translateTradeMessage(message, getRuntimeTranslator("trade"));
}

export function showOrderSubmittedToast(
  summary: string,
  options?: {
    orderId?: string;
    onViewPortfolio?: () => void;
  }
): void {
  const t = getRuntimeTranslator("toast");
  const description = options?.orderId
    ? `${summary} · ${truncateOrderId(options.orderId)}`
    : summary;

  toast.success(t("orderSubmitted"), {
    description,
    action: options?.onViewPortfolio
      ? {
          label: t("viewPortfolio"),
          onClick: options.onViewPortfolio
        }
      : undefined
  });
}

export function showOrderErrorToast(error: unknown): void {
  const t = getRuntimeTranslator("toast");
  toast.error(t("orderFailed"), {
    description: resolveOrderErrorMessage(error)
  });
}

export function formatOrderCancelToastSummary(order: UserOpenOrder): string {
  const tTrade = getRuntimeTranslator("trade");
  const outcomeLabel = order.outcome || "—";
  const sideLabel = order.side?.toLowerCase() === "sell" ? tTrade("sell") : tTrade("buy");
  const price = Number(order.price);
  const priceLabel = Number.isFinite(price)
    ? formatSharePrice(price)
    : order.price;
  const original = Number(order.original_size);
  const matched = Number(order.size_matched);
  const remaining = Number.isFinite(original)
    ? Math.max(0, original - (Number.isFinite(matched) ? matched : 0))
    : 0;

  return `${sideLabel} ${outcomeLabel} · ${priceLabel} · ${formatShareSize(remaining)} shares`;
}

export function showOrderCancelledToast(summary: string): void {
  const t = getRuntimeTranslator("toast");
  toast.success(t("orderCancelled"), {
    description: summary
  });
}

export function formatMarketCancelToastSummary(
  marketTitle: string,
  count: number
): string {
  const t = getRuntimeTranslator("toast");
  const orderLabel = count === 1 ? t("order") : t("orders");

  return `${marketTitle} · ${count} ${orderLabel}`;
}

export function showMarketOrdersCancelledToast(summary: string): void {
  const t = getRuntimeTranslator("toast");
  toast.success(t("ordersCancelled"), {
    description: summary
  });
}

export function showPartialMarketCancelToast(
  cancelledCount: number,
  failedCount: number
): void {
  const t = getRuntimeTranslator("toast");
  toast.warning(t("someOrdersNotCancelled"), {
    description: t("cancelledFailed", { cancelled: cancelledCount, failed: failedCount })
  });
}

function truncateOrderId(orderId: string): string {
  if (orderId.length <= 12) {
    return orderId;
  }

  return `${orderId.slice(0, 8)}…`;
}

function extractOrderFundingFromError(
  error: unknown
): UserOrderFundingCheck | undefined {
  if (!(error instanceof FetchJsonError)) {
    return undefined;
  }

  if (!error.payload || typeof error.payload !== "object") {
    return undefined;
  }

  const funding = (error.payload as { funding?: UserOrderFundingCheck }).funding;

  if (
    !funding ||
    typeof funding.balance !== "string" ||
    typeof funding.allowance !== "string"
  ) {
    return undefined;
  }

  return funding;
}

function isUserRejectedRequest(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("code" in error && Number((error as { code?: unknown }).code) === 4001) {
    return true;
  }

  if ("cause" in error && isUserRejectedRequest((error as { cause?: unknown }).cause)) {
    return true;
  }

  return false;
}

function isWalletRejectionMessage(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("user rejected") ||
    normalized.includes("user denied") ||
    normalized.includes("rejected the request") ||
    normalized.includes("request rejected") ||
    normalized.includes("action_rejected") ||
    normalized.includes("signature was rejected")
  );
}
