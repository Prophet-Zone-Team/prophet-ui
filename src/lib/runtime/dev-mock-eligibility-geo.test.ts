import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getDevMockEligibilityGeoCountry } from "@/lib/runtime/dev-mock-eligibility-geo";

describe("getDevMockEligibilityGeoCountry", () => {
  it("returns undefined outside development", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalMockCountry = process.env.DEV_MOCK_ELIGIBILITY_GEO_COUNTRY;

    process.env.NODE_ENV = "production";
    process.env.DEV_MOCK_ELIGIBILITY_GEO_COUNTRY = "CN";

    try {
      assert.equal(getDevMockEligibilityGeoCountry(), undefined);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      process.env.DEV_MOCK_ELIGIBILITY_GEO_COUNTRY = originalMockCountry;
    }
  });

  it("normalizes configured development country codes", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalMockCountry = process.env.DEV_MOCK_ELIGIBILITY_GEO_COUNTRY;

    process.env.NODE_ENV = "development";
    process.env.DEV_MOCK_ELIGIBILITY_GEO_COUNTRY = " cn ";

    try {
      assert.equal(getDevMockEligibilityGeoCountry(), "CN");
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      process.env.DEV_MOCK_ELIGIBILITY_GEO_COUNTRY = originalMockCountry;
    }
  });
});
