import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveComboLegBuyPrice } from "@/lib/combo/markets-client";
import type { ComboMarketRecord } from "@/types/combo";

describe("resolveComboLegBuyPrice", () => {
  const market: ComboMarketRecord = {
    id: "1",
    conditionId: "0xabc",
    positionIds: ["yes-token", "no-token"],
    slug: "test-market",
    title: "Test",
    outcomes: ["Yes", "No"],
    outcomePrices: ["0.515", "0.485"],
  };

  it("applies market-order slippage to catalog mid price", () => {
    const price = resolveComboLegBuyPrice(market, "yes");

    assert.equal(price, 0.53);
  });
});
