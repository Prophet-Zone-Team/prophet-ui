import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatOutcomeButtonDisplay,
  formatOutcomeMultiplier
} from "@/lib/market/order-math";
import { resolveOutcomeDisplayMode } from "@/lib/market/outcome-display-mode";

describe("formatOutcomeMultiplier", () => {
  it("formats 1/price with 2 decimal places", () => {
    assert.equal(formatOutcomeMultiplier(0.24), "4.17");
    assert.equal(formatOutcomeMultiplier(0.5), "2.00");
  });

  it("clamps to tradable range before dividing", () => {
    assert.equal(formatOutcomeMultiplier(0.01), "100.00");
    assert.equal(formatOutcomeMultiplier(0.99), "1.01");
  });

  it("returns em dash for invalid prices", () => {
    assert.equal(formatOutcomeMultiplier(Number.NaN), "—");
    assert.equal(formatOutcomeMultiplier(0), "—");
  });
});

describe("formatOutcomeButtonDisplay", () => {
  it("returns orderbook price in price mode", () => {
    assert.equal(formatOutcomeButtonDisplay(0.24, "price"), "24.00￠");
  });

  it("returns decimal multiplier in decimal mode", () => {
    assert.equal(formatOutcomeButtonDisplay(0.24, "decimal"), "4.17");
  });
});

describe("resolveOutcomeDisplayMode", () => {
  it("defaults to decimal for zh-TW when no preference is stored", () => {
    assert.equal(resolveOutcomeDisplayMode("zh-TW"), "decimal");
  });

  it("defaults to price for other locales when no preference is stored", () => {
    assert.equal(resolveOutcomeDisplayMode("en"), "price");
    assert.equal(resolveOutcomeDisplayMode("ja"), "price");
  });

  it("respects stored preference over locale default", () => {
    assert.equal(resolveOutcomeDisplayMode("zh-TW", "price"), "price");
    assert.equal(resolveOutcomeDisplayMode("en", "decimal"), "decimal");
  });
});
