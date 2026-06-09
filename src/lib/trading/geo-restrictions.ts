import type { TradingEligibilityStatus } from "@/types/market";

export type GeoRestrictionKind = "eligible" | "blocked" | "close_only";

/** Fully blocked countries per Polymarket geographic restrictions docs. */
export const FULLY_BLOCKED_COUNTRY_CODES = new Set([
  "AU",
  "BE",
  "BY",
  "BI",
  "CF",
  "CD",
  "CU",
  "DE",
  "ET",
  "FR",
  "GB",
  "IR",
  "IQ",
  "IT",
  "KP",
  "LB",
  "LY",
  "MM",
  "NI",
  "NL",
  "RU",
  "SO",
  "SS",
  "SD",
  "SY",
  "UM",
  "US",
  "VE",
  "YE",
  "ZW",
]);

/** Close-only countries: may exit positions but cannot open new ones. */
export const CLOSE_ONLY_COUNTRY_CODES = new Set(["PL", "SG", "TH", "TW"]);

export interface BlockedRegionRule {
  country: string;
  region: string;
}

/** Region-level blocks within otherwise accessible countries. */
export const BLOCKED_REGIONS: BlockedRegionRule[] = [
  { country: "CA", region: "ON" },
  { country: "UA", region: "43" },
  { country: "UA", region: "14" },
  { country: "UA", region: "09" },
];

function normalizeCountry(country?: string) {
  return country?.trim().toUpperCase() ?? "";
}

function normalizeRegion(region?: string) {
  return region?.trim().toUpperCase() ?? "";
}

function isBlockedRegion(country: string, region: string) {
  if (!country || !region) {
    return false;
  }

  return BLOCKED_REGIONS.some(
    (rule) => rule.country === country && rule.region === region,
  );
}

export function classifyGeoRestriction(
  country?: string,
  region?: string,
): GeoRestrictionKind {
  const normalizedCountry = normalizeCountry(country);
  const normalizedRegion = normalizeRegion(region);

  if (!normalizedCountry) {
    return "eligible";
  }

  if (isBlockedRegion(normalizedCountry, normalizedRegion)) {
    return "blocked";
  }

  if (FULLY_BLOCKED_COUNTRY_CODES.has(normalizedCountry)) {
    return "blocked";
  }

  if (CLOSE_ONLY_COUNTRY_CODES.has(normalizedCountry)) {
    return "close_only";
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
  const location = [country, region].filter(Boolean).join(" / ");

  switch (kind) {
    case "blocked":
      return location
        ? `Polymarket reports order placement is unavailable from this location (${location}).`
        : "Polymarket reports order placement is unavailable from this location.";
    case "close_only":
      return location
        ? `New orders and deposits are unavailable in your region (${location}). You may still close existing positions or cancel open orders.`
        : "New orders and deposits are unavailable in your region. You may still close existing positions or cancel open orders.";
    default:
      return "";
  }
}

export function mergeGeoblockWithLocalRules(input: {
  apiBlocked?: boolean;
  country?: string;
  region?: string;
  apiError?: string;
}): {
  kind: GeoRestrictionKind;
  status: TradingEligibilityStatus;
  reason?: string;
} {
  const localKind = classifyGeoRestriction(input.country, input.region);

  if (input.apiBlocked === true) {
    const kind = localKind === "eligible" ? "blocked" : localKind;

    return {
      kind,
      status: toEligibilityStatus(kind),
      reason:
        (input.apiError ??
          defaultReasonForKind(kind, input.country, input.region)) ||
        "Polymarket reports this region is blocked.",
    };
  }

  if (localKind !== "eligible") {
    return {
      kind: localKind,
      status: toEligibilityStatus(localKind),
      reason: defaultReasonForKind(localKind, input.country, input.region),
    };
  }

  return {
    kind: "eligible",
    status: "eligible",
    reason: undefined,
  };
}
