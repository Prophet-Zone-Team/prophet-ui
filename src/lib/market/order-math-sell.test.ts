import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveMaxSellShares } from "@/lib/market/order-math";

describe("resolveMaxSellShares", () => {
  it("caps sell size to zero when on-chain balance is zero", () => {
    assert.equal(resolveMaxSellShares(214.2857, 0), 0);
  });

  it("uses the smallest non-negative candidate", () => {
    assert.equal(resolveMaxSellShares(100, 25.5), 25.5);
  });

  it("returns undefined when no finite candidates are provided", () => {
    assert.equal(resolveMaxSellShares(undefined), undefined);
  });
});
