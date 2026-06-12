import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  deriveDefaultTakeProfitLimitPrice,
  formatTakeProfitLimitDisabledMessage,
  formatTakeProfitLimitPriceString,
  isTakeProfitLimitAvailable,
  LIMIT_BUY_MIN_SHARES,
  validateTakeProfitLimitPrice
} from "@/lib/market/order-math";

describe("deriveDefaultTakeProfitLimitPrice", () => {
  it("returns purchase price plus 20%", () => {
    assert.equal(deriveDefaultTakeProfitLimitPrice(0.23), 0.276);
    assert.equal(formatTakeProfitLimitPriceString(0.23), "0.276");
  });

  it("clamps to the maximum share price", () => {
    assert.equal(deriveDefaultTakeProfitLimitPrice(0.9), 0.99);
  });

  it("clamps invalid purchase prices to the minimum share price", () => {
    assert.equal(deriveDefaultTakeProfitLimitPrice(Number.NaN), 0.01);
    assert.equal(deriveDefaultTakeProfitLimitPrice(0), 0.01);
  });
});

describe("isTakeProfitLimitAvailable", () => {
  it("requires at least the limit order minimum share size", () => {
    assert.equal(isTakeProfitLimitAvailable(LIMIT_BUY_MIN_SHARES - 0.0001), false);
    assert.equal(isTakeProfitLimitAvailable(LIMIT_BUY_MIN_SHARES), true);
    assert.equal(isTakeProfitLimitAvailable(LIMIT_BUY_MIN_SHARES + 1), true);
  });
});

describe("formatTakeProfitLimitDisabledMessage", () => {
  it("mentions the minimum share requirement", () => {
    assert.match(formatTakeProfitLimitDisabledMessage(), /5 shares/);
  });
});

describe("validateTakeProfitLimitPrice", () => {
  it("requires a price when take profit limit is enabled", () => {
    assert.equal(validateTakeProfitLimitPrice(true, ""), "Enter a take profit limit price.");
    assert.equal(validateTakeProfitLimitPrice(true, "   "), "Enter a take profit limit price.");
    assert.equal(validateTakeProfitLimitPrice(true, "0.276"), undefined);
    assert.equal(validateTakeProfitLimitPrice(false, ""), undefined);
  });
});
