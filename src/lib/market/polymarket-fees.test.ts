import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BUILDER_MAKER_FEE_RATE,
  BUILDER_TAKER_FEE_RATE,
  calculateToWinAmount,
  resolveBuilderFeeRate,
} from "@/lib/market/polymarket-fees";

describe("polymarket fees", () => {
  it("resolves maker rate for limit orders and taker rate for market orders", () => {
    assert.equal(resolveBuilderFeeRate("GTC"), BUILDER_MAKER_FEE_RATE);
    assert.equal(resolveBuilderFeeRate("GTD"), BUILDER_MAKER_FEE_RATE);
    assert.equal(resolveBuilderFeeRate("FAK"), BUILDER_TAKER_FEE_RATE);
    assert.equal(resolveBuilderFeeRate("FOK"), BUILDER_TAKER_FEE_RATE);
  });

  it("calculates market buy to win with taker fee, platform fee on profit, and cost", () => {
    const toWin = calculateToWinAmount({
      amount: 100,
      price: 0.5,
      orderType: "FAK",
      tradeSide: "buy",
    });

    assert.equal(toWin, 195.06);
  });

  it("calculates limit buy to win with maker fee, platform fee on profit, and cost", () => {
    const toWin = calculateToWinAmount({
      amount: 200,
      price: 0.5,
      orderType: "GTC",
      tradeSide: "buy",
    });

    assert.equal(toWin, 196.03);
  });

  it("returns zero for invalid or sell-side inputs", () => {
    assert.equal(
      calculateToWinAmount({
        amount: 0,
        price: 0.5,
        orderType: "FAK",
        tradeSide: "buy",
      }),
      0,
    );
    assert.equal(
      calculateToWinAmount({
        amount: 100,
        price: 0.5,
        orderType: "FAK",
        tradeSide: "sell",
      }),
      0,
    );
  });
});
