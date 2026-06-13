import type { TradingEligibilityStatus } from "@/types/market";

export type GeoRestrictionKind = "eligible" | "blocked" | "close_only";

/** Fully blocked countries per local geographic restrictions. */
export const BLOCKED_COUNTRY_CODES = new Set(["CN", "US"]);

function normalizeCountry(country?: string) {
  return country?.trim().toUpperCase() ?? "";
}

export function classifyGeoRestriction(
  country?: string,
  _region?: string,
): GeoRestrictionKind {
  const normalizedCountry = normalizeCountry(country);

  if (!normalizedCountry) {
    return "eligible";
  }

  if (BLOCKED_COUNTRY_CODES.has(normalizedCountry)) {
    return "blocked";
  }

  return "eligible";
}

export function toEligibilityStatus(
  kind: GeoRestrictionKind,
): TradingEligibilityStatus {
  switch (kind) {
    case "blocked":
      return "blocked_region";
    case "close_only":
      return "close_only_region";
    default:
      return "eligible";
  }
}

export function defaultReasonForKind(
  kind: GeoRestrictionKind,
  country?: string,
  region?: string,
): string {
  const location = formatGeoLocation(country, region);

  switch (kind) {
    case "blocked":
      return location
        ? `Order placement is unavailable from this location (${location}).`
        : "Order placement is unavailable from this location.";
    case "close_only":
      return location
        ? `New orders and deposits are unavailable in your region (${location}). You may still close existing positions or cancel open orders.`
        : "New orders and deposits are unavailable in your region. You may still close existing positions or cancel open orders.";
    default:
      return "";
  }
}

export function formatGeoLocation(
  country?: string,
  region?: string,
): string | undefined {
  const location = [country, region].filter(Boolean).join(" / ");

  return location || undefined;
}

export function resolveLocalGeoEligibility(
  country?: string,
  region?: string,
): {
  kind: GeoRestrictionKind;
  status: TradingEligibilityStatus;
  reason?: string;
} {
  const kind = classifyGeoRestriction(country, region);

  return {
    kind,
    status: toEligibilityStatus(kind),
    reason:
      kind === "eligible"
        ? undefined
        : defaultReasonForKind(kind, country, region),
  };
}
