import "server-only";

import {
  defaultReasonForKind,
  mergeGeoblockWithLocalRules,
} from "@/lib/trading/geo-restrictions";
import { resolveEligibilityFromLocalFallback } from "@/lib/trading/eligibility-fallback";
import type { TradingEligibilityStatus, TradingUserSession } from "@/types/market";
import { updateTradingSession } from "@/server/trading/session-store";
import { serverFetch } from "@/server/trading/server-fetch";

const DEFAULT_GEOBLOCK_URL = "https://polymarket.com/api/geoblock";
const GEOBLOCK_TIMEOUT_MS = 8000;

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

export interface ClientGeoHeaders {
  ip?: string;
  country?: string;
  region?: string;
}

export async function checkTradingEligibility(
  clientGeo?: ClientGeoHeaders,
): Promise<TradingEligibilityResult> {
  const checkedAt = new Date().toISOString();

  const isForceEligible = process.env.ELIGIBILITY_FORCE_ELIGIBLE === "true";
  if (isForceEligible) {
    return {
      status: "eligible",
      checkedAt,
      country: undefined,
      region: undefined,
      reason: undefined,
    };
  }

  try {
    const headers: Record<string, string> = { Accept: "application/json" };

    if (clientGeo?.ip) {
      headers["X-Forwarded-For"] = clientGeo.ip;
    }

    const response = await serverFetch(getGeoblockUrl(), {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(GEOBLOCK_TIMEOUT_MS),
    });

    if (!response.ok) {
      return resolveEligibilityFromLocalFallback({
        checkedAt,
        clientGeo,
        apiFailureReason: `Polymarket geoblock check returned ${response.status}.`,
      });
    }

    const payload = (await response.json()) as PolymarketGeoblockResponse;
    const merged = mergeGeoblockWithLocalRules({
      apiBlocked: payload.blocked === true,
      country: payload.country ?? clientGeo?.country,
      region: payload.region ?? clientGeo?.region,
      apiError: payload.error,
    });

    const proxyHint =
      payload.proxy || payload.vpn
        ? " Geoblock returned eligible with proxy/VPN signal present."
        : "";

    return {
      status: merged.status,
      checkedAt,
      country: payload.country ?? clientGeo?.country,
      region: payload.region ?? clientGeo?.region,
      reason: merged.reason
        ? `${merged.reason}${proxyHint}`.trim()
        : proxyHint || undefined,
    };
  } catch (error) {
    return resolveEligibilityFromLocalFallback({
      checkedAt,
      clientGeo,
      apiFailureReason: formatGeoblockFetchError(error),
    });
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

export function formatEligibilityRestrictionReason(
  status: TradingEligibilityStatus,
  country?: string,
  region?: string,
  reason?: string,
) {
  if (reason?.trim()) {
    return reason;
  }

  if (status === "blocked_region") {
    return defaultReasonForKind("blocked", country, region);
  }

  if (status === "close_only_region") {
    return defaultReasonForKind("close_only", country, region);
  }

  return reason;
}

function hasDevelopmentProxyConfigured() {
  return Boolean(
    process.env.HTTPS_PROXY?.trim() ||
    process.env.https_proxy?.trim() ||
    process.env.HTTP_PROXY?.trim() ||
    process.env.http_proxy?.trim(),
  );
}

export async function refreshSessionEligibility(
  session: TradingUserSession,
  clientGeo?: ClientGeoHeaders,
): Promise<TradingUserSession> {
  const eligibility = await checkTradingEligibility(clientGeo);

  return updateTradingSession(withEligibility(session, eligibility));
}

export async function refreshSessionEligibilityIfStale(
  session: TradingUserSession,
  clientGeo?: ClientGeoHeaders,
): Promise<TradingUserSession> {
  return refreshSessionEligibility(session, clientGeo);
}

function withEligibility(
  session: TradingUserSession,
  eligibility: TradingEligibilityResult,
): TradingUserSession {
  return {
    ...session,
    eligibilityStatus: eligibility.status,
    eligibilityCheckedAt: eligibility.checkedAt,
    eligibilityCountry: eligibility.country,
    eligibilityRegion: eligibility.region,
    eligibilityReason: eligibility.reason,
  };
}

export function getClientGeoFromRequest(request: Request): ClientGeoHeaders {
  return {
    ip: getClientIp(request),
    country: getClientCountry(request),
    region: getClientRegion(request),
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

function getClientCountry(request: Request): string | undefined {
  return request.headers.get("cf-ipcountry")?.trim() || undefined;
}

function getClientRegion(request: Request): string | undefined {
  return (
    request.headers.get("cf-region")?.trim() ||
    request.headers.get("cf-region-code")?.trim() ||
    undefined
  );
}

function getGeoblockUrl() {
  return process.env.POLYMARKET_GEOBLOCK_URL?.trim() || DEFAULT_GEOBLOCK_URL;
}
