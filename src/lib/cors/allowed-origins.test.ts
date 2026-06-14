import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  getAllowedCorsOrigins,
  isAllowedCorsOrigin,
  resetAllowedCorsOriginsForTests,
} from "@/lib/cors/allowed-origins";

describe("isAllowedCorsOrigin", () => {
  afterEach(() => {
    delete process.env.CORS_ALLOWED_ORIGINS;
    resetAllowedCorsOriginsForTests();
  });

  it("allows exact localhost origin by default", () => {
    assert.equal(isAllowedCorsOrigin("http://localhost:3000"), true);
  });

  it("allows exact rhea origin by default", () => {
    assert.equal(isAllowedCorsOrigin("https://app.rhea.finance"), true);
  });

  it("allows ref-finance wildcard subdomains by default", () => {
    assert.equal(isAllowedCorsOrigin("https://app.ref-finance.com"), true);
    assert.equal(isAllowedCorsOrigin("https://foo.ref-finance.com"), true);
    assert.equal(isAllowedCorsOrigin("https://ref-finance.com"), true);
  });

  it("rejects wrong protocol and unauthorized domains", () => {
    assert.equal(isAllowedCorsOrigin("http://app.rhea.finance"), false);
    assert.equal(isAllowedCorsOrigin("https://evil.example.com"), false);
    assert.equal(isAllowedCorsOrigin(null), false);
    assert.equal(isAllowedCorsOrigin("not-a-url"), false);
  });

  it("supports custom env overrides", () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://partner.example.com,https://*.partner.example.com";
    resetAllowedCorsOriginsForTests();

    assert.equal(isAllowedCorsOrigin("https://partner.example.com"), true);
    assert.equal(isAllowedCorsOrigin("https://app.partner.example.com"), true);
    assert.equal(isAllowedCorsOrigin("https://app.rhea.finance"), false);
    assert.deepEqual(getAllowedCorsOrigins(), [
      "https://partner.example.com",
      "https://*.partner.example.com",
    ]);
  });
});
