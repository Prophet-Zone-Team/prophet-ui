import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isChinaGeo,
  isWhitelistLoginGeoActive,
  normalizeWhitelistEmail,
} from "@/lib/trading/eligibility-whitelist";

describe("normalizeWhitelistEmail", () => {
  it("lowercases and trims email addresses", () => {
    assert.equal(normalizeWhitelistEmail("  User@Example.COM  "), "user@example.com");
  });
});

describe("isChinaGeo", () => {
  it("matches mainland China country codes", () => {
    assert.equal(isChinaGeo("CN"), true);
    assert.equal(isChinaGeo(" cn "), true);
  });

  it("rejects other countries and empty values", () => {
    assert.equal(isChinaGeo("US"), false);
    assert.equal(isChinaGeo("CA"), false);
    assert.equal(isChinaGeo(undefined), false);
    assert.equal(isChinaGeo(""), false);
  });
});

describe("isWhitelistLoginGeoActive", () => {
  it("requires CN geo and a configured whitelist", () => {
    assert.equal(isWhitelistLoginGeoActive("CN", 1), true);
    assert.equal(isWhitelistLoginGeoActive("CN", 0), false);
    assert.equal(isWhitelistLoginGeoActive("US", 1), false);
    assert.equal(isWhitelistLoginGeoActive(undefined, 1), false);
  });
});
