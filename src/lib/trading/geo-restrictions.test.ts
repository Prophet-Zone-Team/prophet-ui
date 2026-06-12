import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyGeoRestriction,
  resolveLocalGeoEligibility,
  toEligibilityStatus,
} from "@/lib/trading/geo-restrictions";

describe("classifyGeoRestriction", () => {
  it("blocks China and the United States", () => {
    assert.equal(classifyGeoRestriction("CN"), "blocked");
    assert.equal(classifyGeoRestriction("cn"), "blocked");
    assert.equal(classifyGeoRestriction("US"), "blocked");
    assert.equal(classifyGeoRestriction("us", "NY"), "blocked");
  });

  it("treats other countries as eligible", () => {
    assert.equal(classifyGeoRestriction("JP"), "eligible");
    assert.equal(classifyGeoRestriction("PL"), "eligible");
    assert.equal(classifyGeoRestriction("CA", "ON"), "eligible");
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

describe("resolveLocalGeoEligibility", () => {
  it("blocks restricted countries with location details", () => {
    const result = resolveLocalGeoEligibility("US", "NY");

    assert.equal(result.kind, "blocked");
    assert.equal(result.status, "blocked_region");
    assert.match(result.reason ?? "", /unavailable from this location/);
    assert.match(result.reason ?? "", /US \/ NY/);
  });

  it("returns eligible when local rules allow trading", () => {
    const result = resolveLocalGeoEligibility("IE");

    assert.equal(result.kind, "eligible");
    assert.equal(result.status, "eligible");
    assert.equal(result.reason, undefined);
  });

  it("returns eligible when country metadata is missing", () => {
    const result = resolveLocalGeoEligibility(undefined);

    assert.equal(result.kind, "eligible");
    assert.equal(result.status, "eligible");
  });
});
