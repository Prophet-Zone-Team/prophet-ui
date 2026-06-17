import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyTradeLossFromPositions,
  mapProphetUserTransaction
} from "@/lib/portfolio/map-user-transaction";
import type { ProphetUserTransaction } from "@/types/prophet-api";
import type { UserPositionRecord } from "@/types/market";

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
    title: "Will Canada win on 2026-06-12?",
    slug: "fifwc-can-bih-2026-06-12-can",
    eventSlug: "fifwc-can-bih-2026-06-12",
    outcome: "Yes",
    outcomeIndex: 0,
    negativeRisk: true,
    ...overrides
  };
}

describe("mapProphetUserTransaction", () => {
  it("maps trade rows using trade_side and size", () => {
    const row: ProphetUserTransaction = {
      id: 1,
      type: "trade",
      trade_side: "sell",
      order_type: "taker",
      side: "yes",
      price: "0.42",
      size: "25",
      amount: "25",
      market_name: "Team A vs Team B",
      trade_create_at: "2026-06-01T12:00:00.000Z"
    };

    const mapped = mapProphetUserTransaction(row);

    assert.equal(mapped.type, "sell");
    assert.equal(mapped.size, 25);
    assert.equal(mapped.amount, "10.5");
    assert.equal(mapped.tradeCreatedAt, "2026-06-01T12:00:00.000Z");
  });

  it("maps order rows using trade_side", () => {
    const row: ProphetUserTransaction = {
      id: 2,
      type: "order",
      trade_side: "buy",
      order_type: "maker",
      side: "no",
      price: "0.18",
      size: "10",
      amount: "1.8",
      trade_create_at: "2026-06-02T08:30:00.000Z"
    };

    const mapped = mapProphetUserTransaction(row);

    assert.equal(mapped.type, "buy");
    assert.equal(mapped.size, 10);
    assert.equal(mapped.tradeCreatedAt, "2026-06-02T08:30:00.000Z");
  });

  it("maps funding rows directly", () => {
    const deposit = mapProphetUserTransaction({
      type: "deposit",
      amount: "100",
      trade_create_at: "2026-06-03T01:00:00.000Z"
    });
    const withdraw = mapProphetUserTransaction({
      type: "withdraw",
      amount: "50",
      trade_create_at: "2026-06-03T02:00:00.000Z"
    });
    const redeem = mapProphetUserTransaction({
      type: "redeem",
      price: "1",
      size: "12",
      amount: "12",
      trade_create_at: "2026-06-03T03:00:00.000Z"
    });

    assert.equal(deposit.type, "deposit");
    assert.equal(withdraw.type, "withdraw");
    assert.equal(redeem.type, "redeem");
    assert.equal(redeem.amount, "12");
  });

  it("keeps legacy buy/sell rows working", () => {
    const mapped = mapProphetUserTransaction({
      type: "buy",
      side: "yes",
      price: "0.5",
      amount: "20",
      created_at: "2026-05-01T00:00:00.000Z"
    });

    assert.equal(mapped.type, "buy");
    assert.equal(mapped.tradeCreatedAt, "2026-05-01T00:00:00.000Z");
  });
});

describe("applyTradeLossFromPositions", () => {
  it("marks trade buy rows as loss when matching zero-value position", () => {
    const row: ProphetUserTransaction = {
      id: 10,
      type: "trade",
      trade_side: "buy",
      side: "yes",
      slug: "fifwc-can-bih-2026-06-12-can",
      price: "0.54",
      size: "3.5",
      amount: "2"
    };
    const mapped = mapProphetUserTransaction(row);
    const positions = [createZeroValuePosition()];

    const result = applyTradeLossFromPositions([mapped], [row], positions);

    assert.equal(result[0].type, "loss");
  });

  it("keeps trade buy rows as buy when position currentValue is positive", () => {
    const row: ProphetUserTransaction = {
      id: 11,
      type: "trade",
      trade_side: "buy",
      side: "yes",
      slug: "fifwc-can-bih-2026-06-12-can",
      price: "0.54",
      size: "3.5",
      amount: "2"
    };
    const mapped = mapProphetUserTransaction(row);
    const positions = [createZeroValuePosition({ currentValue: 1.5 })];

    const result = applyTradeLossFromPositions([mapped], [row], positions);

    assert.equal(result[0].type, "buy");
  });

  it("keeps trade buy rows as buy when positions API returns no rows", () => {
    const row: ProphetUserTransaction = {
      id: 15,
      type: "trade",
      trade_side: "buy",
      side: "yes",
      slug: "fifwc-can-bih-2026-06-12-can",
      price: "0.54",
      size: "3.5",
      amount: "2"
    };
    const mapped = mapProphetUserTransaction(row);

    const result = applyTradeLossFromPositions([mapped], [row], []);

    assert.equal(result[0].type, "buy");
  });

  it("keeps trade buy rows as buy when slug does not match any position", () => {
    const row: ProphetUserTransaction = {
      id: 16,
      type: "trade",
      trade_side: "buy",
      side: "yes",
      slug: "unrelated-market-slug",
      team_name: "Canada",
      price: "0.54",
      size: "3.5",
      amount: "2"
    };
    const mapped = mapProphetUserTransaction(row);
    const positions = [createZeroValuePosition()];

    const result = applyTradeLossFromPositions([mapped], [row], positions);

    assert.equal(result[0].type, "buy");
  });

  it("keeps trade sell rows as sell even when position currentValue is zero", () => {
    const row: ProphetUserTransaction = {
      id: 12,
      type: "trade",
      trade_side: "sell",
      side: "yes",
      slug: "fifwc-can-bih-2026-06-12-can",
      price: "0.42",
      size: "2",
      amount: "2"
    };
    const mapped = mapProphetUserTransaction(row);
    const positions = [createZeroValuePosition()];

    const result = applyTradeLossFromPositions([mapped], [row], positions);

    assert.equal(result[0].type, "sell");
  });

  it("does not mark order or deposit rows as loss", () => {
    const orderRow: ProphetUserTransaction = {
      id: 13,
      type: "order",
      trade_side: "buy",
      side: "yes",
      slug: "fifwc-can-bih-2026-06-12-can"
    };
    const depositRow: ProphetUserTransaction = {
      id: 14,
      type: "deposit",
      amount: "100"
    };
    const mapped = [
      mapProphetUserTransaction(orderRow),
      mapProphetUserTransaction(depositRow)
    ];
    const positions = [createZeroValuePosition()];

    const result = applyTradeLossFromPositions(
      mapped,
      [orderRow, depositRow],
      positions
    );

    assert.equal(result[0].type, "buy");
    assert.equal(result[1].type, "deposit");
  });
});
