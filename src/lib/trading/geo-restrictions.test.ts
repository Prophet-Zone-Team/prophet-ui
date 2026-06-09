import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyGeoRestriction,
  mergeGeoblockWithLocalRules,
  toEligibilityStatus,
} from "@/lib/trading/geo-restrictions";

describe("classifyGeoRestriction", () => {
  it("classifies fully blocked countries", () => {
    assert.equal(classifyGeoRestriction("US"), "blocked");
    assert.equal(classifyGeoRestriction("us", "NY"), "blocked");
  });

  it("classifies close-only countries", () => {
    assert.equal(classifyGeoRestriction("PL"), "close_only");
    assert.equal(classifyGeoRestriction("TW"), "close_only");
  });

  it("classifies blocked regions", () => {
    assert.equal(classifyGeoRestriction("CA", "ON"), "blocked");
    assert.equal(classifyGeoRestriction("UA", "43"), "blocked");
  });

  it("treats Japan as API-eligible", () => {
    assert.equal(classifyGeoRestriction("JP"), "eligible");
  });

  it("treats unknown countries as eligible", () => {
    assert.equal(classifyGeoRestriction("IE"), "eligible");
    assert.equal(classifyGeoRestriction(undefined), "eligible");
  });
});

describe("toEligibilityStatus", () => {
  it("maps restriction kinds to trading statuses", () => {
    assert.equal(toEligibilityStatus("eligible"), "eligible");
    assert.equal(toEligibilityStatus("blocked"), "blocked_region");
    assert.equal(toEligibilityStatus("close_only"), "close_only_region");
  });
});

describe("mergeGeoblockWithLocalRules", () => {
  it("splits API blocked Poland into close-only", () => {
    const result = mergeGeoblockWithLocalRules({
      apiBlocked: true,
      country: "PL",
      region: "",
    });

    assert.equal(result.kind, "close_only");
    assert.equal(result.status, "close_only_region");
  });

  it("applies local rules when API reports eligible", () => {
    const result = mergeGeoblockWithLocalRules({
      apiBlocked: false,
      country: "US",
      region: "NY",
    });

    assert.equal(result.kind, "blocked");
    assert.equal(result.status, "blocked_region");
  });

  it("returns eligible when API and local rules agree", () => {
    const result = mergeGeoblockWithLocalRules({
      apiBlocked: false,
      country: "IE",
    });

    assert.equal(result.kind, "eligible");
    assert.equal(result.status, "eligible");
  });
});
