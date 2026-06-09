import {
  classifyGeoRestriction,
  defaultReasonForKind,
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

  if (country) {
    const status = toEligibilityStatus(localKind);
    const localReason = defaultReasonForKind(localKind, country, region);

    return {
      status,
      checkedAt: input.checkedAt,
      country,
      region,
      reason:
        localKind === "eligible"
          ? `${input.apiFailureReason} Applied local geographic rules from IP metadata.`
          : `${input.apiFailureReason} ${localReason}`.trim(),
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
