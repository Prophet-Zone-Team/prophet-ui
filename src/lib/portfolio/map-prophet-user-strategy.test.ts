import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolvePortfolioStrategyStatus,
  resolveStrategyTeamTournamentState
} from "@/lib/strategy/portfolio-strategy-status";
import type { ProphetStrategyTeamItem } from "@/types/prophet-api";

import {
  computeLegPositionMetrics,
  mapProphetUserStrategy,
  normalizeStrategyStringArray,
  parseStrategyCurrPrice,
  resolveStrategyTeamStates,
  sumLegAmounts
} from "./map-prophet-user-strategy";

const sampleApiStrategy = {
  id: 1,
  name: "Test strategy",
  roi: "202.1%",
  value: "10.5",
  hit_return: "$21",
  created_at: "2026-06-04T07:14:19Z",
  teams: [
    {
      order_id: [
        "0x4a53bad5c610182e8a3fdc98feeccdce6fb0eb210628a4c84985c9bf5398cf80"
      ],
      slug: "will-spain-win-the-2026-fifa-world-cup-963",
      amount: ["4.92"],
      price: ["0.16"],
      name: "Spain",
      tx_hash: [
        "0x4a53bad5c610182e8a3fdc98feeccdce6fb0eb210628a4c84985c9bf5398cf80"
      ],
      curr_price: '["0.1595", "0.8405"]'
    },
    {
      order_id: [
        "0xea046d4f0353930da443cdcd1db6c01f5f8a9930c505474b44be0b0aa0bd5e7e"
      ],
      slug: "will-france-win-the-2026-fifa-world-cup-924",
      amount: ["5.26"],
      price: ["0.171"],
      name: "France",
      tx_hash: [
        "0xea046d4f0353930da443cdcd1db6c01f5a9930c505474b44be0b0aa0bd5e7e"
      ],
      curr_price: '["0.1615", "0.8385"]'
    }
  ]
};

describe("normalizeStrategyStringArray", () => {
  it("wraps scalar strings in an array", () => {
    assert.deepEqual(normalizeStrategyStringArray("5.01"), ["5.01"]);
  });

  it("returns arrays unchanged and filters empty entries", () => {
    assert.deepEqual(normalizeStrategyStringArray(["5.01", "", " 2.00 "]), [
      "5.01",
      "2.00"
    ]);
  });
});

describe("sumLegAmounts", () => {
  it("sums traded amount and total shares across paired entries", () => {
    const result = sumLegAmounts(["5.01", "2.00"], ["0.16", "0.20"]);

    assert.equal(result.tradedAmount, 7.01);
    assert.equal(result.totalShares, 5.01 / 0.16 + 2 / 0.2);
  });
});

describe("parseStrategyCurrPrice", () => {
  it("parses JSON array and returns the first price", () => {
    assert.equal(parseStrategyCurrPrice('["0.1705", "0.8295"]'), 0.1705);
  });

  it("falls back to plain decimal strings", () => {
    assert.equal(parseStrategyCurrPrice("0.42"), 0.42);
  });

  it("returns 0 for invalid input", () => {
    assert.equal(parseStrategyCurrPrice(undefined), 0);
    assert.equal(parseStrategyCurrPrice(""), 0);
  });
});

describe("computeLegPositionMetrics", () => {
  const baseItem: ProphetStrategyTeamItem = {
    order_id: ["order-1"],
    amount: ["10"],
    price: ["0.2"],
    curr_price: '["0.25", "0.75"]'
  };

  it("computes mark-to-market value and PnL from curr_price", () => {
    const metrics = computeLegPositionMetrics(baseItem);

    assert.equal(metrics.tradedAmount, 10);
    assert.equal(metrics.entryPrice, 0.2);
    assert.equal(metrics.totalShares, 50);
    assert.equal(metrics.currentValue, 12.5);
    assert.equal(metrics.cashPnl, 2.5);
    assert.equal(metrics.percentPnl, 25);
  });

  it("aggregates multiple orders in amount and price arrays", () => {
    const metrics = computeLegPositionMetrics({
      order_id: ["order-1", "order-2"],
      amount: ["5.01", "2.00"],
      price: ["0.16", "0.20"],
      curr_price: '["0.1595", "0.8405"]'
    });

    const expectedShares = 5.01 / 0.16 + 2 / 0.2;

    assert.equal(metrics.tradedAmount, 7.01);
    assert.equal(metrics.totalShares, expectedShares);
    assert.equal(metrics.currentValue, expectedShares * 0.1595);
  });

  it("supports legacy scalar amount and price fields", () => {
    const metrics = computeLegPositionMetrics({
      order_id: "order-1",
      amount: "10",
      price: "0.2",
      curr_price: '["0.25", "0.75"]'
    });

    assert.equal(metrics.tradedAmount, 10);
    assert.equal(metrics.currentValue, 12.5);
  });

  it("returns zero PnL when prices are missing", () => {
    const metrics = computeLegPositionMetrics({
      ...baseItem,
      curr_price: undefined
    });

    assert.equal(metrics.currentValue, 10);
    assert.equal(metrics.cashPnl, 0);
    assert.equal(metrics.percentPnl, 0);
  });
});

describe("portfolio strategy status from API teams", () => {
  it("maps Spain + France without API status to not open yet", () => {
    const teamStates = resolveStrategyTeamStates(sampleApiStrategy.teams);
    const status = resolvePortfolioStrategyStatus(teamStates);

    assert.equal(status, "not_open");
  });

  it("maps mixed API team status to not finished", () => {
    const teamStates = resolveStrategyTeamStates([
      { order_id: "1", name: "Spain", status: "started" },
      { order_id: "2", name: "France", status: "not_started" }
    ]);

    assert.equal(resolvePortfolioStrategyStatus(teamStates), "not_finished");
  });

  it("maps all API eliminated teams to hit missed", () => {
    const teamStates = resolveStrategyTeamStates([
      { order_id: "1", name: "Spain", status: "eliminated" },
      { order_id: "2", name: "France", status: "eliminated" }
    ]);

    assert.equal(resolvePortfolioStrategyStatus(teamStates), "hit_missed");
  });
});

describe("mapProphetUserStrategy", () => {
  it("maps sample API strategy status to not open yet", () => {
    const record = mapProphetUserStrategy(sampleApiStrategy);

    assert.ok(record);
    assert.equal(record.status, "not_open");
    assert.equal(record.statusLabel, "Not open yet");
    assert.equal(record.legs.length, 2);
  });

  it("maps array API legs with aggregated traded and to-win amounts", () => {
    const record = mapProphetUserStrategy(sampleApiStrategy);

    assert.ok(record);
    assert.equal(record.legs[0]?.tradedAmount, 4.92);
    assert.equal(record.legs[0]?.toWinAmount, 4.92 / 0.16);
    assert.equal(record.legs[1]?.tradedAmount, 5.26);
    assert.equal(record.legs[1]?.toWinAmount, 5.26 / 0.171);
  });

  it("maps leg toWin from shares when API to_win is absent", () => {
    const record = mapProphetUserStrategy({
      id: 1,
      name: "Test",
      teams: [
        {
          order_id: ["order-1"],
          name: "Spain",
          amount: ["10"],
          price: ["0.25"]
        }
      ]
    });

    assert.ok(record);
    assert.equal(record.legs[0]?.toWinAmount, 40);
  });

  it("prefers API to_win when provided", () => {
    const record = mapProphetUserStrategy({
      id: 2,
      teams: [
        {
          order_id: ["order-2"],
          name: "Spain",
          amount: ["10"],
          price: ["0.25"],
          to_win: "55"
        }
      ]
    });

    assert.equal(record?.legs[0]?.toWinAmount, 55);
  });

  it("supports legacy scalar order_id and amount fields", () => {
    const record = mapProphetUserStrategy({
      id: 3,
      teams: [
        {
          order_id: "order-legacy",
          name: "Spain",
          amount: "10",
          price: "0.25"
        }
      ]
    });

    assert.ok(record);
    assert.equal(record.legs[0]?.id, "order-legacy");
    assert.equal(record.legs[0]?.tradedAmount, 10);
    assert.equal(record.legs[0]?.toWinAmount, 40);
  });

  it("drops legs without a valid order_id", () => {
    const record = mapProphetUserStrategy({
      id: 4,
      teams: [
        {
          order_id: [],
          name: "Spain",
          amount: ["10"],
          price: ["0.25"]
        }
      ]
    });

    assert.ok(record);
    assert.equal(record.legs.length, 0);
  });
});
