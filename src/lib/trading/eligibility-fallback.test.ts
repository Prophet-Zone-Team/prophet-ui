import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mergeGeoblockWithLocalRules } from "@/lib/trading/geo-restrictions";
import { resolveEligibilityFromLocalFallback } from "@/lib/trading/eligibility-fallback";

describe("mergeGeoblockWithLocalRules eligibility integration", () => {
  it("maps API blocked + PL to close_only_region", () => {
    const merged = mergeGeoblockWithLocalRules({
      apiBlocked: true,
      country: "PL",
    });

    assert.equal(merged.kind, "close_only");
    assert.equal(merged.status, "close_only_region");
  });

  it("maps API eligible + US to blocked_region via local rules", () => {
    const merged = mergeGeoblockWithLocalRules({
      apiBlocked: false,
      country: "US",
    });

    assert.equal(merged.kind, "blocked");
    assert.equal(merged.status, "blocked_region");
  });
});

describe("resolveEligibilityFromLocalFallback", () => {
  it("applies local rules when geoblock API fails and CF country is present", () => {
    const result = resolveEligibilityFromLocalFallback({
      checkedAt: new Date().toISOString(),
      clientGeo: { country: "US" },
      apiFailureReason: "Polymarket geoblock check returned 404.",
    });

    assert.equal(result.status, "blocked_region");
    assert.equal(result.country, "US");
    assert.match(result.reason ?? "", /Applied local geographic rules/);
  });

  it("returns error when API fails and no geo metadata is available", () => {
    const result = resolveEligibilityFromLocalFallback({
      checkedAt: new Date().toISOString(),
      apiFailureReason: "Polymarket geoblock check timed out.",
    });

    assert.equal(result.status, "error");
  });
});
