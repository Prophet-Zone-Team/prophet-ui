import {
  classifyGeoRestriction,
  toEligibilityStatus,
} from "@/lib/trading/geo-restrictions";
import type { TradingEligibilityStatus } from "@/types/market";

export interface EligibilityLocalFallbackInput {
  checkedAt: string;
  clientGeo?: {
    country?: string;
    region?: string;
  };
  apiFailureReason: string;
}

export interface EligibilityLocalFallbackResult {
  status: TradingEligibilityStatus;
  checkedAt: string;
  country?: string;
  region?: string;
  reason?: string;
}

export function resolveEligibilityFromLocalFallback(
  input: EligibilityLocalFallbackInput,
): EligibilityLocalFallbackResult {
  const country = input.clientGeo?.country;
  const region = input.clientGeo?.region;
  const localKind = classifyGeoRestriction(country, region);

  if (country && localKind !== "eligible") {
    return {
      status: toEligibilityStatus(localKind),
      checkedAt: input.checkedAt,
      country,
      region,
      reason: `${input.apiFailureReason} Applied local geographic rules from IP metadata.`,
    };
  }

  return {
    status: "error",
    checkedAt: input.checkedAt,
    country,
    region,
    reason: input.apiFailureReason,
  };
}
