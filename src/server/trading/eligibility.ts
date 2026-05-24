import "server-only";

import type { TradingEligibilityStatus, TradingUserSession } from "@/types/market";
import { updateTradingSession } from "@/server/trading/session-store";
import { serverFetch } from "@/server/trading/server-fetch";

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

export async function checkTradingEligibility(clientIp?: string): Promise<TradingEligibilityResult> {
  const checkedAt = new Date().toISOString();

  try {
    const headers: Record<string, string> = { Accept: "application/json" };

    if (clientIp) {
      headers["X-Forwarded-For"] = clientIp;
    }

    const response = await serverFetch(getGeoblockUrl(), {
      method: "GET",
      headers,
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
      reason: formatGeoblockFetchError(error),
    };
  }
}

export function isGeoblockNetworkError(reason: string | undefined) {
  if (!reason) {
    return false;
  }

  const normalized = reason.toLowerCase();

  return (
    normalized.includes("timeout") ||
    normalized.includes("aborted") ||
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("unreachable")
  );
}

export function formatGeoblockFetchError(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);

  if (isGeoblockNetworkError(detail)) {
    return formatGeoblockNetworkErrorMessage();
  }

  return detail;
}

export function formatGeoblockNetworkErrorMessage() {
  const proxyHint =
    process.env.NODE_ENV === "development" && !hasDevelopmentProxyConfigured()
      ? " In development, set HTTPS_PROXY if Polymarket APIs require a local proxy."
      : "";

  return `Polymarket geoblock check timed out or is unreachable.${proxyHint} Retry the eligibility check or verify server network access.`;
}

export function formatEligibilityErrorDetail(reason: string | undefined) {
  if (isGeoblockNetworkError(reason)) {
    return formatGeoblockNetworkErrorMessage();
  }

  return reason ?? "Polymarket geoblock check failed.";
}

function hasDevelopmentProxyConfigured() {
  return Boolean(
    process.env.HTTPS_PROXY?.trim() ||
      process.env.https_proxy?.trim() ||
      process.env.HTTP_PROXY?.trim() ||
      process.env.http_proxy?.trim(),
  );
}

export async function refreshSessionEligibility(session: TradingUserSession, clientIp?: string): Promise<TradingUserSession> {
  const eligibility = await checkTradingEligibility(clientIp);

  return updateTradingSession(withEligibility(session, eligibility));
}

export async function refreshSessionEligibilityIfStale(session: TradingUserSession, clientIp?: string): Promise<TradingUserSession> {
  if (isFreshEligibleSession(session)) {
    return session;
  }

  const eligibility = await checkTradingEligibility(clientIp);

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

export function getClientIp(request: Request): string | undefined {
  const cfIp = request.headers.get("cf-connecting-ip");

  if (cfIp) {
    return cfIp;
  }

  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp;
  }

  return undefined;
}

function getGeoblockUrl() {
  return process.env.POLYMARKET_GEOBLOCK_URL?.trim() || DEFAULT_GEOBLOCK_URL;
}
