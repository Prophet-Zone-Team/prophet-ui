"use client";

import { fetchJson } from "@/lib/team/client-fetch";
import { formatGeoLocation } from "@/lib/trading/geo-restrictions";
import type { TradingEligibilityStatus, TradingUserSession } from "@/types/market";

export const REGION_BLOCKED_LABEL = "Trading unavailable";
export const CLOSE_ONLY_LABEL = "Close-only region";

export function isRegionFullyBlocked(
  status: TradingEligibilityStatus | undefined,
): boolean {
  return status === "blocked_region";
}

export function isRegionCloseOnly(
  status: TradingEligibilityStatus | undefined,
): boolean {
  return status === "close_only_region";
}

export function isRegionBlocked(
  status: TradingEligibilityStatus | undefined,
): boolean {
  return isRegionFullyBlocked(status);
}

export function isBuyRestricted(
  status: TradingEligibilityStatus | undefined,
): boolean {
  return isRegionFullyBlocked(status) || isRegionCloseOnly(status);
}

export function isCancelRestricted(
  status: TradingEligibilityStatus | undefined,
): boolean {
  return isRegionFullyBlocked(status);
}

export function isSellRestricted(
  status: TradingEligibilityStatus | undefined,
): boolean {
  return isRegionFullyBlocked(status);
}

export interface TradingEligibilityView {
  status: TradingEligibilityStatus;
  checkedAt?: string;
  country?: string;
  region?: string;
  reason?: string;
  whitelistLoginMode?: boolean;
}

export function formatRegionBlockedLabel(
  view: TradingEligibilityView | undefined,
) {
  const location = formatGeoLocation(view?.country, view?.region);

  if (location) {
    return `${REGION_BLOCKED_LABEL} (${location})`;
  }

  return REGION_BLOCKED_LABEL;
}

export function formatCloseOnlyLabel(view: TradingEligibilityView | undefined) {
  const location = formatGeoLocation(view?.country, view?.region);

  if (location) {
    return `${CLOSE_ONLY_LABEL} (${location})`;
  }

  return CLOSE_ONLY_LABEL;
}

export function formatRegionBlockedDetail(view: TradingEligibilityView | undefined) {
  const location = formatGeoLocation(view?.country, view?.region);
  const reason =
    view?.reason ??
    "Order placement is unavailable from this location. Market data remains available for review.";

  if (location && !reason.includes(location)) {
    return `${reason} (${location})`;
  }

  return reason;
}

export function formatCloseOnlyDetail(view: TradingEligibilityView | undefined) {
  const location = formatGeoLocation(view?.country, view?.region);
  const reason =
    view?.reason ??
    "New orders and deposits are unavailable in your region. You may still close existing positions or cancel open orders.";

  if (location && !reason.includes(location)) {
    return `${reason} (${location})`;
  }

  return reason;
}

export function formatEligibilityRestrictionLabel(
  view: TradingEligibilityView | undefined,
) {
  if (isRegionCloseOnly(view?.status)) {
    return formatCloseOnlyLabel(view);
  }

  if (isRegionFullyBlocked(view?.status)) {
    return formatRegionBlockedLabel(view);
  }

  return formatRegionBlockedLabel(view);
}

export function formatEligibilityRestrictionDetail(
  view: TradingEligibilityView | undefined,
) {
  if (isRegionCloseOnly(view?.status)) {
    return formatCloseOnlyDetail(view);
  }

  if (isRegionFullyBlocked(view?.status)) {
    return formatRegionBlockedDetail(view);
  }

  return formatRegionBlockedDetail(view);
}

export function eligibilityViewFromSession(
  session: TradingUserSession | undefined,
): TradingEligibilityView | undefined {
  if (!session?.eligibilityStatus) {
    return undefined;
  }

  return {
    status: session.eligibilityStatus,
    checkedAt: session.eligibilityCheckedAt,
    country: session.eligibilityCountry,
    region: session.eligibilityRegion,
    reason: session.eligibilityReason,
  };
}

export function resolveEligibilityView(
  session: TradingUserSession | undefined,
  standaloneEligibility: TradingEligibilityView | undefined,
): TradingEligibilityView | undefined {
  const sessionView = eligibilityViewFromSession(session);

  if (sessionView?.status && sessionView.status !== "unknown") {
    return sessionView;
  }

  return standaloneEligibility;
}

export function resolveIsRegionBlocked(
  session: TradingUserSession | undefined,
  standaloneEligibility: TradingEligibilityView | undefined,
): boolean {
  const view = resolveEligibilityView(session, standaloneEligibility);
  return isRegionFullyBlocked(view?.status);
}

export function resolveIsBuyRestricted(
  session: TradingUserSession | undefined,
  standaloneEligibility: TradingEligibilityView | undefined,
): boolean {
  const view = resolveEligibilityView(session, standaloneEligibility);
  return isBuyRestricted(view?.status);
}

export function resolveIsRegionCloseOnly(
  session: TradingUserSession | undefined,
  standaloneEligibility: TradingEligibilityView | undefined,
): boolean {
  const view = resolveEligibilityView(session, standaloneEligibility);
  return isRegionCloseOnly(view?.status);
}

export async function fetchTradingEligibility(): Promise<TradingEligibilityView> {
  const response = await fetchJson<{ eligibility: TradingEligibilityView }>(
    "/api/trading/eligibility",
  );

  return response.eligibility;
}

export async function checkEligibilityWhitelistEmail(
  email: string,
): Promise<{ allowed: boolean; reason?: string }> {
  return fetchJson<{ allowed: boolean; reason?: string }>(
    "/api/trading/eligibility/whitelist-check",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    },
  );
}

export function syncStandaloneFromSession(
  session: TradingUserSession | undefined,
): TradingEligibilityView | undefined {
  return eligibilityViewFromSession(session);
}
