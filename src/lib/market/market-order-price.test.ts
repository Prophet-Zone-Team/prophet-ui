import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isSignedMarketOrderPriceWithinGuard,
  resolveMarketOrderWorstPrice,
} from "@/lib/market/order-math";

describe("resolveMarketOrderWorstPrice", () => {
  it("uses the ticket price when REST best ask is stale and lower", () => {
    const price = resolveMarketOrderWorstPrice({
      tradeSide: "buy",
      sidePrice: 0.054,
      bestAsk: 0.05,
      tickSize: "0.001",
    });

    assert.equal(price, 0.055);
  });

  it("applies slippage above the live ask when ticket and book agree", () => {
    const price = resolveMarketOrderWorstPrice({
      tradeSide: "buy",
      sidePrice: 0.054,
      bestAsk: 0.054,
      tickSize: "0.001",
    });

    assert.equal(price, 0.055);
  });

  it("applies downward slippage for market sells", () => {
    const price = resolveMarketOrderWorstPrice({
      tradeSide: "sell",
      sidePrice: 0.46,
      bestBid: 0.45,
      tickSize: "0.01",
    });

    assert.equal(price, 0.44);
  });

  it("falls back to the ticket price when book quotes are missing", () => {
    const price = resolveMarketOrderWorstPrice({
      tradeSide: "buy",
      sidePrice: 0.054,
      tickSize: "0.001",
    });

    assert.equal(price, 0.055);
  });
});

describe("isSignedMarketOrderPriceWithinGuard", () => {
  it("allows SDK rounding above the guarded buy price for high-probability markets", () => {
    const withinGuard = isSignedMarketOrderPriceWithinGuard({
      orderPrice: 5_000_000 / 5_681_818,
      tradeSide: "buy",
      sidePrice: 0.86,
      bestAsk: 0.86,
      tickSize: "0.01",
    });

    assert.equal(withinGuard, true);
  });

  it("allows ticket prices above the current best ask when slippage is applied", () => {
    const withinGuard = isSignedMarketOrderPriceWithinGuard({
      orderPrice: 0.9,
      tradeSide: "buy",
      sidePrice: 0.88,
      bestAsk: 0.86,
      tickSize: "0.01",
    });

    assert.equal(withinGuard, true);
  });

  it("rejects buy orders that are materially above the guarded price", () => {
    const withinGuard = isSignedMarketOrderPriceWithinGuard({
      orderPrice: 0.95,
      tradeSide: "buy",
      sidePrice: 0.88,
      bestAsk: 0.86,
      tickSize: "0.01",
    });

    assert.equal(withinGuard, false);
  });
});
