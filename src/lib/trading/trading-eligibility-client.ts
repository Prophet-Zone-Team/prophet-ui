"use client";

import { fetchJson } from "@/lib/team/client-fetch";
import type { TradingEligibilityStatus, TradingUserSession } from "@/types/market";

export const REGION_BLOCKED_LABEL = "Restricted region";

export interface TradingEligibilityView {
  status: TradingEligibilityStatus;
  checkedAt?: string;
  country?: string;
  region?: string;
  reason?: string;
}

export function isRegionBlocked(
  status: TradingEligibilityStatus | undefined,
): boolean {
  return status === "blocked_region";
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
  return isRegionBlocked(view?.status);
}

export async function fetchTradingEligibility(): Promise<TradingEligibilityView> {
  const response = await fetchJson<{ eligibility: TradingEligibilityView }>(
    "/api/trading/eligibility",
  );

  return response.eligibility;
}

export function formatRegionBlockedDetail(view: TradingEligibilityView | undefined) {
  const location = [view?.country, view?.region].filter(Boolean).join(" / ");
  const reason =
    view?.reason ?? "Polymarket reports trading is unavailable in your region.";

  if (location) {
    return `${reason} (${location})`;
  }

  return reason;
}

export function syncStandaloneFromSession(
  session: TradingUserSession | undefined,
): TradingEligibilityView | undefined {
  return eligibilityViewFromSession(session);
}
