import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PolymarketActivityRow } from "@/lib/portfolio/fetch-polymarket-activity";
import {
  mapActivityBatchWithLossInsertions,
  mapLossPositionToTransaction,
  mapPolymarketActivity,
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
    conditionId: "0xcondition",
    asset: "asset-1",
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

describe("mapActivityBatchWithLossInsertions", () => {
  it("inserts loss before matching buy by conditionId and asset", () => {
    const insertedLossIds = new Set<string>();
    const rows = [
      createTradeRow({ transactionHash: "0xclaim", type: "YIELD", side: "" }),
      createTradeRow({ transactionHash: "0xbuy" })
    ];
    const lossPositions = [createZeroValuePosition()];

    const result = mapActivityBatchWithLossInsertions(
      rows,
      lossPositions,
      insertedLossIds
    );

    assert.equal(result.length, 3);
    assert.equal(result[0].type, "claim");
    assert.equal(result[1].type, "loss");
    assert.equal(result[2].type, "buy");
    assert.equal(insertedLossIds.size, 1);
  });

  it("does not insert loss when conditionId or asset does not match", () => {
    const insertedLossIds = new Set<string>();
    const rows = [
      createTradeRow({
        conditionId: "0xother",
        asset: "asset-other"
      })
    ];
    const lossPositions = [createZeroValuePosition()];

    const result = mapActivityBatchWithLossInsertions(
      rows,
      lossPositions,
      insertedLossIds
    );

    assert.equal(result.length, 1);
    assert.equal(result[0].type, "buy");
    assert.equal(insertedLossIds.size, 0);
  });

  it("does not insert the same loss twice across batches", () => {
    const insertedLossIds = new Set<string>();
    const lossPositions = [createZeroValuePosition()];
    const firstBatch = mapActivityBatchWithLossInsertions(
      [createTradeRow({ transactionHash: "0xbuy1" })],
      lossPositions,
      insertedLossIds
    );
    const secondBatch = mapActivityBatchWithLossInsertions(
      [createTradeRow({ transactionHash: "0xbuy2" })],
      lossPositions,
      insertedLossIds
    );

    assert.equal(firstBatch.length, 2);
    assert.equal(firstBatch[0].type, "loss");
    assert.equal(secondBatch.length, 1);
    assert.equal(secondBatch[0].type, "buy");
  });

  it("preserves API row order without global reordering", () => {
    const insertedLossIds = new Set<string>();
    const rows = [
      createTradeRow({
        timestamp: 1782000000,
        transactionHash: "0xnewer",
        type: "REDEEM",
        side: ""
      }),
      createTradeRow({
        timestamp: 1781000000,
        transactionHash: "0xolder"
      })
    ];

    const result = mapActivityBatchWithLossInsertions(
      rows,
      [createZeroValuePosition()],
      insertedLossIds
    );

    assert.equal(result.length, 3);
    assert.equal(result[0].type, "redeem");
    assert.equal(result[1].type, "loss");
    assert.equal(result[2].type, "buy");
  });
});
