"use client";

import { toast } from "sonner";

import { formatShareSize } from "@/lib/market/order-math";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { BidTradeSide, OrderOutcomeSide } from "@/types/market";

export interface OrderToastSummaryInput {
  tradeSide: BidTradeSide;
  outcomeSide: OrderOutcomeSide;
  estimatedTotalCost: number;
  shareSize: number;
  variant?: "team" | "game";
  teamName?: string;
}

const WALLET_REJECTION_MESSAGE = "Signature request was cancelled.";

export function formatOrderToastSummary(input: OrderToastSummaryInput): string {
  const outcomeLabel = input.outcomeSide === "yes" ? "Yes" : "No";
  const prefix = input.teamName ? `${input.teamName} · ` : "";

  if (input.tradeSide === "sell") {
    return `${prefix}Sell ${outcomeLabel} · ${formatShareSize(input.shareSize)} shares`;
  }

  const buyVerb =
    input.variant === "team" ? "Bid for" : "Buy";

  return `${prefix}${buyVerb} ${outcomeLabel} · ${formatTeamDetailMoney(input.estimatedTotalCost)} est. cost`;
}

export function resolveOrderErrorMessage(error: unknown): string {
  if (isUserRejectedRequest(error)) {
    return WALLET_REJECTION_MESSAGE;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (isWalletRejectionMessage(message)) {
    return WALLET_REJECTION_MESSAGE;
  }

  return message;
}

export function showOrderSubmittedToast(
  summary: string,
  options?: {
    orderId?: string;
    onViewPortfolio?: () => void;
  }
): void {
  const description = options?.orderId
    ? `${summary} · ${truncateOrderId(options.orderId)}`
    : summary;

  toast.success("Order submitted", {
    description,
    action: options?.onViewPortfolio
      ? {
          label: "View portfolio",
          onClick: options.onViewPortfolio
        }
      : undefined
  });
}

export function showOrderErrorToast(error: unknown): void {
  toast.error(resolveOrderErrorMessage(error));
}

function truncateOrderId(orderId: string): string {
  if (orderId.length <= 12) {
    return orderId;
  }

  return `${orderId.slice(0, 8)}…`;
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
