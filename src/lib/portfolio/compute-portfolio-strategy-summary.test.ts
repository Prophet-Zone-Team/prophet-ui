import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { TeamMarketSnapshot } from "@/types/market";
import type { PortfolioStrategyRecord } from "@/views/portfolio/strategy/types";

import { enrichPortfolioStrategyRecord } from "./compute-portfolio-strategy-summary";

function buildSnapshot(
  teamId: string,
  name: string,
  probability: number
): TeamMarketSnapshot {
  return {
    team: {
      id: teamId,
      name,
      code: name.slice(0, 3).toUpperCase()
    },
    market: {
      probability,
      polymarket: {
        acceptingOrders: true,
        minOrderSize: 1,
        tokens: {
          yes: { tokenId: `token-${teamId}` },
          no: { tokenId: `token-${teamId}-no` }
        }
      }
    }
  } as TeamMarketSnapshot;
}

const baseRecord: PortfolioStrategyRecord = {
  id: "1",
  name: "Test",
  status: "not_finished",
  statusLabel: "Not Finished",
  roiLabel: "10.0%",
  value: 100,
  hitReturnLabel: "$500",
  legs: [
    {
      id: "leg-1",
      team: { code: "ESP", name: "Spain", logoUrl: undefined },
      marketTitle: "Spain",
      side: "yes",
      tradedAmount: 50,
      toWinAmount: 200,
      currentValue: 60,
      cashPnl: 10,
      percentPnl: 20,
      tradedAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "leg-2",
      team: { code: "FRA", name: "France", logoUrl: undefined },
      marketTitle: "France",
      side: "yes",
      tradedAmount: 50,
      toWinAmount: 200,
      currentValue: 40,
      cashPnl: -10,
      percentPnl: -20,
      tradedAt: "2026-01-01T00:00:00.000Z"
    }
  ]
};

describe("enrichPortfolioStrategyRecord", () => {
  it("aggregates live value and ROI from legs", () => {
    const enriched = enrichPortfolioStrategyRecord(baseRecord, []);

    assert.equal(enriched.value, 100);
    assert.equal(enriched.roiLabel, "0.0%");
  });

  it("computes hit return from snapshots when allocation is available", () => {
    const snapshots = [
      buildSnapshot("spain", "Spain", 20),
      buildSnapshot("france", "France", 15)
    ];

    const enriched = enrichPortfolioStrategyRecord(baseRecord, snapshots);

    assert.equal(enriched.hitReturnLabel, "$286");
  });

  it("keeps API hit return when snapshots cannot build allocation", () => {
    const enriched = enrichPortfolioStrategyRecord(baseRecord, []);

    assert.equal(enriched.hitReturnLabel, "$500");
  });
});
