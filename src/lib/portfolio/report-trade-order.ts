import { getProphetReferral } from "@/service/prophet";
import type {
  ProphetLoginReferral,
  ProphetReportOrderStatus,
  ProphetReportOrderType
} from "@/types/prophet-api";
import type { TradingOrderType, UserOrderPreview, UserOrderStatus } from "@/types/market";

function formatTransactionAmount(value: number): string {
  return Number.isFinite(value) ? String(value) : "0";
}

export function resolveReportOrderType(
  orderType: TradingOrderType
): ProphetReportOrderType {
  return orderType === "GTC" || orderType === "GTD" ? "maker" : "taker";
}

export function resolveReportOrderStatus(
  status: UserOrderStatus | undefined
): ProphetReportOrderStatus {
  if (status === "filled" || status === "partially_filled") {
    return "completed";
  }

  if (status === "rejected" || status === "error") {
    return "failed";
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  return "completed";
}

export function resolveReportOrderValueUsdc(preview: UserOrderPreview): string {
  if (preview.side === "buy") {
    return formatTransactionAmount(
      preview.estimatedTotalCost ?? preview.estimatedCost
    );
  }

  return formatTransactionAmount(
    preview.estimatedProceeds ?? preview.estimatedCost
  );
}

export function resolveBoundReferralCode(
  referral: ProphetLoginReferral | null
): string | undefined {
  if (!referral?.has_bound_referral) {
    return undefined;
  }

  const code = referral.bound_referral_code?.trim();

  return code || undefined;
}

export function resolveReportReferralCode(): string | undefined {
  return resolveBoundReferralCode(getProphetReferral());
}
