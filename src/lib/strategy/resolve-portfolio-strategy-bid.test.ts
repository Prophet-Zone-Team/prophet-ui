import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { STRATEGY_DATA } from "@/data/strategy";
import { mapCuratedTeamToRef } from "@/views/strategy/lib/map-strategy-data";
import type { PortfolioStrategyRecord } from "@/views/portfolio/strategy/types";

import {
  canPortfolioStrategyBidAgain,
  findPortfolioStrategyTemplateId,
  resolveAvailableStrategyForPortfolio
} from "./resolve-portfolio-strategy-bid";

function buildPortfolioRecord(
  overrides: Partial<PortfolioStrategyRecord> & {
    legs?: PortfolioStrategyRecord["legs"];
  } = {}
): PortfolioStrategyRecord {
  const southAmerican = STRATEGY_DATA["south-american"];

  return {
    id: "42",
    name: southAmerican.name,
    status: "not_finished",
    statusLabel: "Not Finished",
    roiLabel: "12%",
    value: 1000,
    hitReturnLabel: "$1,200",
    legs: southAmerican.teams.map((team, index) => ({
      id: `leg-${index}`,
      team: mapCuratedTeamToRef(team),
      marketTitle: team.name,
      side: "yes" as const,
      tradedAmount: 100,
      toWinAmount: 200,
      currentValue: 110,
      cashPnl: 10,
      percentPnl: 10,
      tradedAt: "2026-05-22T12:49:00.000Z"
    })),
    ...overrides
  };
}

describe("findPortfolioStrategyTemplateId", () => {
  it("matches by team set", () => {
    const record = buildPortfolioRecord();

    assert.equal(findPortfolioStrategyTemplateId(record), "south-american");
  });

  it("matches by strategy name when team set differs in count", () => {
    const record = buildPortfolioRecord({
      legs: buildPortfolioRecord().legs.slice(0, 3)
    });

    assert.equal(findPortfolioStrategyTemplateId(record), "south-american");
  });

  it("returns null when team count and name do not match any template", () => {
    const record = buildPortfolioRecord({
      name: "Unknown custom strategy",
      legs: [
        {
          id: "leg-1",
          team: { code: "XYZ", name: "Unknown Team" },
          marketTitle: "Unknown Team",
          side: "yes",
          tradedAmount: 10,
          toWinAmount: 20,
          currentValue: 10,
          cashPnl: 0,
          percentPnl: 0,
          tradedAt: "2026-05-22T12:49:00.000Z"
        }
      ]
    });

    assert.equal(findPortfolioStrategyTemplateId(record), null);
  });
});

describe("resolveAvailableStrategyForPortfolio", () => {
  it("returns available strategy card data for a matched template", () => {
    const record = buildPortfolioRecord();
    const resolved = resolveAvailableStrategyForPortfolio(record, []);

    assert.ok(resolved);
    assert.equal(resolved?.id, "south-american");
    assert.equal(resolved?.name, STRATEGY_DATA["south-american"].name);
    assert.equal(resolved?.legs.length, STRATEGY_DATA["south-american"].teams.length);
  });

  it("returns null when no template matches", () => {
    const record = buildPortfolioRecord({
      name: "Unknown custom strategy",
      legs: []
    });

    assert.equal(resolveAvailableStrategyForPortfolio(record, []), null);
  });
});

describe("canPortfolioStrategyBidAgain", () => {
  it("allows bid again for active strategies with a known template", () => {
    const record = buildPortfolioRecord({ status: "not_open" });

    assert.equal(canPortfolioStrategyBidAgain(record), true);
  });

  it("disallows bid again for ended strategies", () => {
    assert.equal(
      canPortfolioStrategyBidAgain(
        buildPortfolioRecord({ status: "hit_succeed" })
      ),
      false
    );
    assert.equal(
      canPortfolioStrategyBidAgain(
        buildPortfolioRecord({ status: "hit_missed" })
      ),
      false
    );
  });

  it("disallows bid again when template cannot be resolved", () => {
    const record = buildPortfolioRecord({
      name: "Unknown custom strategy",
      legs: []
    });

    assert.equal(canPortfolioStrategyBidAgain(record), false);
  });
});
