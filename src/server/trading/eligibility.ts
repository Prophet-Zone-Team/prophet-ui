import "server-only";

import type { TradingEligibilityStatus, TradingUserSession } from "../../types/market";
import { updateTradingSession } from "./sessionStore";

const DEFAULT_GEOBLOCK_URL = "https://polymarket.com/api/geoblock";
const GEOBLOCK_TIMEOUT_MS = 8000;
const ELIGIBILITY_FRESH_MS = 1000 * 60 * 5;
const ELIGIBILITY_ERROR_GRACE_MS = 1000 * 60 * 30;

export interface TradingEligibilityResult {
  status: TradingEligibilityStatus;
  checkedAt: string;
  country?: string;
  region?: string;
  reason?: string;
}

interface PolymarketGeoblockResponse {
  blocked?: boolean;
  country?: string;
  region?: string;
  proxy?: boolean;
  vpn?: boolean;
  error?: string;
}

export async function checkTradingEligibility(): Promise<TradingEligibilityResult> {
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(getGeoblockUrl(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(GEOBLOCK_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        status: "error",
        checkedAt,
        reason: `Polymarket geoblock check returned ${response.status}.`,
      };
    }

    const payload = (await response.json()) as PolymarketGeoblockResponse;

    if (payload.blocked === true) {
      return {
        status: "blocked_region",
        checkedAt,
        country: payload.country,
        region: payload.region,
        reason: payload.error ?? "Polymarket reports this region is blocked.",
      };
    }

    return {
      status: "eligible",
      checkedAt,
      country: payload.country,
      region: payload.region,
      reason: payload.proxy || payload.vpn ? "Geoblock returned eligible with proxy/VPN signal present." : undefined,
    };
  } catch (error) {
    return {
      status: "error",
      checkedAt,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function refreshSessionEligibility(session: TradingUserSession): Promise<TradingUserSession> {
  const eligibility = await checkTradingEligibility();

  return updateTradingSession(withEligibility(session, eligibility));
}

export async function refreshSessionEligibilityIfStale(session: TradingUserSession): Promise<TradingUserSession> {
  if (isFreshEligibleSession(session)) {
    return session;
  }

  const eligibility = await checkTradingEligibility();

  if (eligibility.status === "error" && isEligibleSessionWithin(session, ELIGIBILITY_ERROR_GRACE_MS)) {
    console.warn("[trading.eligibility] geoblock refresh failed; using cached eligible session", {
      userId: session.userId,
      checkedAt: session.eligibilityCheckedAt,
      refreshReason: eligibility.reason,
      refreshCheckedAt: eligibility.checkedAt,
    });

    return session;
  }

  return updateTradingSession(withEligibility(session, eligibility));
}

function isFreshEligibleSession(session: TradingUserSession) {
  return isEligibleSessionWithin(session, ELIGIBILITY_FRESH_MS);
}

function isEligibleSessionWithin(session: TradingUserSession, maxAgeMs: number) {
  if (session.eligibilityStatus !== "eligible" || !session.eligibilityCheckedAt) {
    return false;
  }

  const checkedAt = Date.parse(session.eligibilityCheckedAt);

  return Number.isFinite(checkedAt) && Date.now() - checkedAt <= maxAgeMs;
}

function withEligibility(session: TradingUserSession, eligibility: TradingEligibilityResult): TradingUserSession {
  return {
    ...session,
    eligibilityStatus: eligibility.status,
    eligibilityCheckedAt: eligibility.checkedAt,
    eligibilityCountry: eligibility.country,
    eligibilityRegion: eligibility.region,
    eligibilityReason: eligibility.reason,
  };
}

function getGeoblockUrl() {
  return process.env.POLYMARKET_GEOBLOCK_URL?.trim() || DEFAULT_GEOBLOCK_URL;
}
