import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizePriceChange } from "@/lib/market/normalize-price-change";

describe("normalizePriceChange", () => {
  it("returns 0 for undefined", () => {
    assert.equal(normalizePriceChange(undefined), 0);
  });

  it("converts fractional gamma price deltas to percentage points", () => {
    assert.equal(normalizePriceChange(0.01), 1);
  });

  it("preserves sub-point movements instead of rounding them to zero", () => {
    assert.equal(normalizePriceChange(0.0005), 0.05);
    assert.equal(normalizePriceChange(-0.0005), -0.05);
    assert.equal(normalizePriceChange(0.002), 0.2);
  });

  it("keeps one decimal place for larger moves", () => {
    assert.equal(normalizePriceChange(0.012), 1.2);
    assert.equal(normalizePriceChange(1.5), 1.5);
  });
});
