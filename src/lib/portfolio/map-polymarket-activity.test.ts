import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PolymarketActivityRow } from "@/lib/portfolio/fetch-polymarket-activity";
import {
  mapLossPositionToTransaction,
  mapPolymarketActivity,
  mergePortfolioHistoryByTime,
  resolveActivityPortfolioType
} from "@/lib/portfolio/map-polymarket-activity";
import type { UserPositionRecord } from "@/types/market";

function createTradeRow(
  overrides: Partial<PolymarketActivityRow> = {}
): PolymarketActivityRow {
  return {
    timestamp: 1781662158,
    type: "TRADE",
    size: 6.097555,
    usdcSize: 5.026985,
    transactionHash: "0xabc",
    price: 0.82,
    side: "BUY",
    outcome: "Yes",
    title: "Will Argentina win on 2026-06-16?",
    slug: "fifwc-arg-alg-2026-06-16-arg",
    eventSlug: "fifwc-arg-alg-2026-06-16",
    ...overrides
  };
}

function createZeroValuePosition(
  overrides: Partial<UserPositionRecord> = {}
): UserPositionRecord {
  return {
    proxyWallet: "0xproxy",
    asset: "asset-1",
    conditionId: "0xcondition",
    size: 3.5,
    avgPrice: 0.54,
    initialValue: 2,
    currentValue: 0,
    cashPnl: -2,
    percentPnl: -100,
    totalBought: 3.5,
    realizedPnl: 0,
    percentRealizedPnl: -100,
    curPrice: 0,
    redeemable: true,
    mergeable: false,
    title: "Will Argentina win on 2026-06-16?",
    slug: "fifwc-arg-alg-2026-06-16-arg",
    eventSlug: "fifwc-arg-alg-2026-06-16",
    outcome: "Yes",
    outcomeIndex: 0,
    endDate: "2026-06-16",
    negativeRisk: true,
    ...overrides
  };
}

describe("resolveActivityPortfolioType", () => {
  it("maps trade sides to buy and sell", () => {
    assert.equal(resolveActivityPortfolioType("TRADE", "BUY"), "buy");
    assert.equal(resolveActivityPortfolioType("TRADE", "SELL"), "sell");
  });

  it("maps redeem, deposit, withdraw, and reward-like types", () => {
    assert.equal(resolveActivityPortfolioType("REDEEM"), "redeem");
    assert.equal(resolveActivityPortfolioType("DEPOSIT"), "deposit");
    assert.equal(resolveActivityPortfolioType("WITHDRAW"), "withdraw");
    assert.equal(resolveActivityPortfolioType("YIELD"), "claim");
    assert.equal(resolveActivityPortfolioType("SPLIT"), "activity");
  });
});

describe("mapPolymarketActivity", () => {
  it("maps trade rows with market fields", () => {
    const mapped = mapPolymarketActivity(createTradeRow());

    assert.equal(mapped.type, "buy");
    assert.equal(mapped.side, "Yes");
    assert.equal(mapped.slug, "fifwc-arg-alg-2026-06-16-arg");
    assert.equal(mapped.amount, "5.026985");
    assert.equal(mapped.txHash, "0xabc");
    assert.equal(mapped.teamName, "Argentina");
  });

  it("maps redeem rows", () => {
    const mapped = mapPolymarketActivity(
      createTradeRow({
        type: "REDEEM",
        side: "",
        outcome: "",
        usdcSize: 6.097555,
        price: 0
      })
    );

    assert.equal(mapped.type, "redeem");
    assert.equal(mapped.amount, "6.097555");
  });
});

describe("mapLossPositionToTransaction", () => {
  it("maps zero-value positions to loss records", () => {
    const mapped = mapLossPositionToTransaction(createZeroValuePosition());

    assert.equal(mapped.type, "loss");
    assert.equal(mapped.amount, "2");
    assert.equal(mapped.slug, "fifwc-arg-alg-2026-06-16-arg");
    assert.equal(mapped.teamName, "Argentina");
    assert.equal(mapped.tradeCreatedAt, "2026-06-16T23:59:59.000Z");
    assert.equal(mapped.txHash, "");
  });
});

describe("mergePortfolioHistoryByTime", () => {
  it("sorts activity and loss records by time descending", () => {
    const buy = mapPolymarketActivity(
      createTradeRow({ timestamp: 1781000000 })
    );
    const loss = mapLossPositionToTransaction(createZeroValuePosition());

    const merged = mergePortfolioHistoryByTime([loss, buy]);

    assert.equal(merged[0].type, "buy");
    assert.equal(merged[1].type, "loss");
  });
});
