import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { TeamMarketSnapshot } from "@/types/market";
import {
  getStrategyBidSignableLegs,
  INSUFFICIENT_FUNDS_MESSAGE,
  isAggregateBuyInsufficientFunds,
  validateStrategyBid
} from "@/lib/strategy/strategy-bid-validation";
import { STRATEGY_DATA } from "@/data/strategy";
import { findCuratedTeamByName } from "@/data/teams/curated-team-list";

function buildSnapshot(teamId: string, name: string, probability: number): TeamMarketSnapshot {
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

function buildStrategyLegs(strategyEntry: (typeof STRATEGY_DATA)["south-american"]) {
  return strategyEntry.teams.map((team) => ({
    id: team.abbreviation,
    team: {
      code: team.abbreviation,
      name: team.name,
      logoUrl: team.logo
    },
    teamName: team.name,
    marketLabel: `Will ${team.name} win the 2026 FIFA World Cup?`,
    side: "yes" as const,
    valueLabel: "—",
    probabilityLabel: "—",
    hitReturnLabel: "—"
  }));
}

describe("validateStrategyBid", () => {
  it("marks legs below min order size as invalid", () => {
    const strategyEntry = STRATEGY_DATA["south-american"];
    const snapshots = strategyEntry.teams.map((team) => {
      const curated = findCuratedTeamByName(team.name);

      return buildSnapshot(
        curated?.id ?? team.abbreviation,
        team.name,
        team.name === "Brazil" ? 80 : 5
      );
    });

    const result = validateStrategyBid({
      strategy: {
        id: "south-american",
        ...strategyEntry,
        teamRefs: [],
        legs: buildStrategyLegs(strategyEntry),
        budgetLabel: "$1,000",
        estimatedRoiLabel: "—",
        hitReturnLabel: "—"
      },
      snapshots,
      bidAmount: 10,
      availableCash: 1000,
      riskAccepted: true
    });

    assert.equal(result.canProceedToSign, false);
    assert.ok(result.legs.some((leg) => !leg.validation.valid));
  });

  it("blocks proceed when aggregate balance is insufficient", () => {
    const strategyEntry = STRATEGY_DATA["south-american"];
    const snapshots = strategyEntry.teams.map((team) => {
      const curated = findCuratedTeamByName(team.name);

      return buildSnapshot(curated?.id ?? team.abbreviation, team.name, 20);
    });

    const result = validateStrategyBid({
      strategy: {
        id: "south-american",
        ...strategyEntry,
        teamRefs: [],
        legs: buildStrategyLegs(strategyEntry),
        budgetLabel: "$1,000",
        estimatedRoiLabel: "—",
        hitReturnLabel: "—"
      },
      snapshots,
      bidAmount: 1000,
      availableCash: 100,
      riskAccepted: true
    });

    assert.equal(result.insufficientFunds, true);
    assert.equal(result.canProceedToSign, false);
  });

  it("exports insufficient funds message constant", () => {
    assert.equal(isAggregateBuyInsufficientFunds(200, 100), true);
    assert.equal(INSUFFICIENT_FUNDS_MESSAGE, "Insufficient funds");
  });

  it("allows proceed in test mode when pre-validation would fail", () => {
    const strategyEntry = STRATEGY_DATA["south-american"];
    const snapshots = strategyEntry.teams.map((team) => {
      const curated = findCuratedTeamByName(team.name);

      return buildSnapshot(
        curated?.id ?? team.abbreviation,
        team.name,
        team.name === "Brazil" ? 80 : 5
      );
    });

    const result = validateStrategyBid({
      strategy: {
        id: "south-american",
        ...strategyEntry,
        teamRefs: [],
        legs: buildStrategyLegs(strategyEntry),
        budgetLabel: "$1,000",
        estimatedRoiLabel: "—",
        hitReturnLabel: "—"
      },
      snapshots,
      bidAmount: 10,
      availableCash: 1,
      riskAccepted: true,
      skipPreValidation: true
    });

    assert.equal(result.canProceedToSign, true);
    assert.equal(result.insufficientFunds, true);
    assert.ok(result.legs.some((leg) => !leg.validation.valid));
    assert.ok(getStrategyBidSignableLegs(result.legs, { skipPreValidation: true }).length > 0);
  });
});
