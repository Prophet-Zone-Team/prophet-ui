"use client";

import { toast } from "sonner";

import {
  formatEligibilityRestrictionDetail,
  formatEligibilityRestrictionLabel,
  isBuyRestricted,
  type TradingEligibilityView,
} from "@/lib/trading/trading-eligibility-client";

export function isTradingEligibilityRestricted(
  view: TradingEligibilityView | undefined,
): boolean {
  return isBuyRestricted(view?.status);
}

export function showRegionRestrictionToast(
  view: TradingEligibilityView | undefined,
): void {
  if (!isTradingEligibilityRestricted(view)) {
    return;
  }

  toast.warning(formatEligibilityRestrictionLabel(view), {
    description: formatEligibilityRestrictionDetail(view),
    duration: 10_000,
  });
}
