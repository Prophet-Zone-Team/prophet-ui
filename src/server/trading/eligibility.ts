import "server-only";

import {
  defaultReasonForKind,
  resolveLocalGeoEligibility
} from "@/lib/trading/geo-restrictions";
import type { TradingEligibilityStatus, TradingUserSession } from "@/types/market";
import { lookupGeoFromIp } from "@/server/trading/ip-geolocation";
import { updateTradingSession } from "@/server/trading/session-store";

export interface TradingEligibilityResult {
  status: TradingEligibilityStatus;
  checkedAt: string;
  country?: string;
  region?: string;
  reason?: string;
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

  let country = clientGeo?.country;
  let region = clientGeo?.region;

  if (!country && clientGeo?.ip) {
    const lookup = await lookupGeoFromIp(clientGeo.ip);
    country = lookup?.country ?? country;
    region = lookup?.region ?? region;
  }

  const resolved = resolveLocalGeoEligibility(country, region);

  return {
    status: resolved.status,
    checkedAt,
    country,
    region,
    reason: resolved.reason
  };
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

  const vercelIp = request.headers.get("x-vercel-forwarded-for");

  if (vercelIp) {
    return vercelIp.split(",")[0].trim();
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
  return (
    request.headers.get("cf-ipcountry")?.trim() ||
    request.headers.get("x-vercel-ip-country")?.trim() ||
    undefined
  );
}

function getClientRegion(request: Request): string | undefined {
  return (
    request.headers.get("cf-region")?.trim() ||
    request.headers.get("cf-region-code")?.trim() ||
    request.headers.get("x-vercel-ip-country-region")?.trim() ||
    undefined
  );
}
