import "server-only";

import { formatEligibilityRestrictionReason } from "@/server/trading/eligibility";
import type { TradingEligibilityStatus, TradingUserSession } from "@/types/market";

export type OrderEligibilitySide = "buy" | "sell";

export type EligibilityGuardResult =
  | { ok: true }
  | { ok: false; status: TradingEligibilityStatus; reason: string };

export function assertEligibilityForOrder(
  session: TradingUserSession,
  side: OrderEligibilitySide,
): EligibilityGuardResult {
  const status = session.eligibilityStatus;

  if (status === "eligible") {
    return { ok: true };
  }

  if (status === "close_only_region" && side === "sell") {
    return { ok: true };
  }

  if (status === "blocked_region" || status === "close_only_region") {
    return {
      ok: false,
      status,
      reason:
        formatEligibilityRestrictionReason(
          status,
          session.eligibilityCountry,
          session.eligibilityRegion,
          session.eligibilityReason,
        ) || "Trading is not enabled for this session.",
    };
  }

  return {
    ok: false,
    status,
    reason:
      session.eligibilityReason ??
      "Trading eligibility must be confirmed before submitting orders.",
  };
}

export function assertEligibilityForCancel(
  session: TradingUserSession,
): EligibilityGuardResult {
  const status = session.eligibilityStatus;

  if (status === "eligible" || status === "close_only_region") {
    return { ok: true };
  }

  if (status === "blocked_region") {
    return {
      ok: false,
      status,
      reason:
        formatEligibilityRestrictionReason(
          status,
          session.eligibilityCountry,
          session.eligibilityRegion,
          session.eligibilityReason,
        ) || "Trading is not enabled for this session.",
    };
  }

  return {
    ok: false,
    status,
    reason:
      session.eligibilityReason ??
      "Trading eligibility must be confirmed before cancelling orders.",
  };
}

export function assertEligibilityForBuySetup(
  session: TradingUserSession,
): EligibilityGuardResult {
  return assertEligibilityForOrder(session, "buy");
}

export function assertEligibilityStatusForBuySetup(input: {
  status: TradingEligibilityStatus;
  country?: string;
  region?: string;
  reason?: string;
}): EligibilityGuardResult {
  if (input.status === "eligible") {
    return { ok: true };
  }

  if (input.status === "blocked_region" || input.status === "close_only_region") {
    return {
      ok: false,
      status: input.status,
      reason:
        formatEligibilityRestrictionReason(
          input.status,
          input.country,
          input.region,
          input.reason,
        ) || "Trading is not enabled for this session.",
    };
  }

  return {
    ok: false,
    status: input.status,
    reason:
      input.reason ??
      "Trading eligibility must be confirmed before continuing setup.",
  };
}

export function signedOrderSideToEligibilitySide(
  side: "BUY" | "SELL",
): OrderEligibilitySide {
  return side === "BUY" ? "buy" : "sell";
}
