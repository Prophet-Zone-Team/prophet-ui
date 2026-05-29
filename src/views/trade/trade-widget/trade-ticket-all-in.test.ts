import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateOrderEstimate,
  roundBudgetDown,
} from "@/lib/market/order-math";
import {
  formatMarketBuyAmountInput,
  isBuyInsufficientFunds,
  resolveMarketBuyAllInAmount,
} from "@/views/trade/trade-widget/trade-ticket-helpers";

const fee = { rate: 0.25, exponent: 2 };

describe("roundBudgetDown", () => {
  it("does not round sub-cent balances up to the next cent", () => {
    assert.equal(roundBudgetDown(5.005), 5.005);
    assert.notEqual(roundBudgetDown(5.005), 5.01);
  });
});

describe("resolveMarketBuyAllInAmount", () => {
  it("returns a budget whose estimated total stays within available cash", () => {
    const availableCash = 5.005;
    const sidePrice = 0.5;
    const budget = resolveMarketBuyAllInAmount({
      availableCash,
      sidePrice,
      fee,
    });

    assert.ok(budget > 0);

    const estimate = calculateOrderEstimate({
      side: "yes",
      tradeSide: "buy",
      amount: budget,
      probability: sidePrice * 100,
      limitPrice: sidePrice,
      orderType: "FAK",
      fee,
    });

    assert.ok(estimate.estimatedTotalCost <= availableCash);
    assert.equal(formatMarketBuyAmountInput(budget), "5.005");
  });

  it("avoids insufficient funds when preview uses the all-in amount", () => {
    const availableCash = 5.005;
    const sidePrice = 0.5;
    const budget = resolveMarketBuyAllInAmount({
      availableCash,
      sidePrice,
      fee,
    });
    const estimate = calculateOrderEstimate({
      side: "yes",
      tradeSide: "buy",
      amount: budget,
      probability: sidePrice * 100,
      limitPrice: sidePrice,
      orderType: "FAK",
      fee,
    });

    assert.equal(
      isBuyInsufficientFunds({
        tradeSide: "buy",
        preview: { estimatedTotalCost: estimate.estimatedTotalCost },
        readiness: {
          ready: false,
          credentials: {
            hasClobCredentials: true,
            storage: "session",
          },
          checks: [],
          balances: {
            walletAddress: "0x0000000000000000000000000000000000000001",
            clobUsdcAvailable: availableCash,
            usdcAvailable: availableCash,
            updatedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        },
      }),
      false
    );
  });
});
