import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { roundPriceToTick } from "@/lib/market/order-math";

describe("roundPriceToTick", () => {
  it("rounds high-precision WS prices to the default 0.01 tick", () => {
    assert.equal(roundPriceToTick(0.07622572313223767), 0.08);
    assert.equal(roundPriceToTick(0.074891234567), 0.07);
  });

  it("respects finer tick sizes", () => {
    assert.equal(roundPriceToTick(0.07622572313223767, "0.001"), 0.076);
    assert.equal(roundPriceToTick(0.07622572313223767, "0.0001"), 0.0762);
    assert.equal(roundPriceToTick(0.006, "0.001"), 0.006);
  });

  it("clamps invalid prices to the tradable range before rounding", () => {
    assert.equal(roundPriceToTick(0.005, "0.01"), 0.01);
    assert.equal(roundPriceToTick(0.995, "0.01"), 0.99);
  });
});
