import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapProphetUserTransaction } from "@/lib/portfolio/map-user-transaction";
import type { ProphetUserTransaction } from "@/types/prophet-api";

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
