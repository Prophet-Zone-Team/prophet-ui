import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isGameFixtureOutcomeBidReady,
  isGameMoneylineBidReady,
  shouldDefaultGameMarketOrder
} from "@/lib/market/trade-ticket";
import type {
  FixtureMarketOutcome,
  GameMarketSnapshot
} from "@/types/market";

function buildSnapshot(
  overrides: Partial<GameMarketSnapshot> = {}
): GameMarketSnapshot {
  return {
    match: {
      id: "game-1",
      stage: "GROUP",
      kickoffAt: "2026-06-11T00:00:00.000Z",
      status: "scheduled"
    },
    outcomes: [
      {
        side: "home",
        label: "Home win",
        probability: 45,
        tokenId: "home-token"
      },
      {
        side: "draw",
        label: "Draw",
        probability: 25,
        tokenId: "draw-token"
      },
      {
        side: "away",
        label: "Away win",
        probability: 30,
        tokenId: "away-token"
      }
    ],
    market: {
      volume: 1000,
      acceptingOrders: true,
      source: "polymarket",
      freshness: {
        source: "polymarket",
        status: "live"
      }
    },
    ...overrides
  };
}

function buildOutcome(
  overrides: Partial<FixtureMarketOutcome> = {}
): FixtureMarketOutcome {
  return {
    id: "moneyline:home",
    category: "lines",
    label: "Home",
    marketType: "moneyline",
    side: "home",
    probability: 45,
    price: 0.45,
    tokenId: "home-token",
    yesAsk: 0.46,
    acceptingOrders: true,
    ...overrides
  };
}

describe("shouldDefaultGameMarketOrder", () => {
  it("returns true when fixture outcome has ask liquidity and accepts orders", () => {
    const snapshot = buildSnapshot();
    const outcome = buildOutcome();

    assert.equal(
      shouldDefaultGameMarketOrder(snapshot, outcome, "yes"),
      true
    );
    assert.equal(isGameFixtureOutcomeBidReady(outcome, snapshot, "yes"), true);
  });

  it("returns false when fixture outcome has no ask or display price", () => {
    const snapshot = buildSnapshot();
    const outcome = buildOutcome({
      yesAsk: undefined,
      noAsk: undefined,
      price: undefined,
      probability: undefined,
    });

    assert.equal(
      shouldDefaultGameMarketOrder(snapshot, outcome, "yes"),
      false
    );
  });

  it("returns true when fixture outcome has snapshot price but no live ask", () => {
    const snapshot = buildSnapshot();
    const outcome = buildOutcome({ yesAsk: undefined, noAsk: undefined });

    assert.equal(
      shouldDefaultGameMarketOrder(snapshot, outcome, "yes"),
      true
    );
    assert.equal(isGameFixtureOutcomeBidReady(outcome, snapshot, "yes"), true);
  });

  it("falls back to moneyline token readiness when no fixture outcome is selected", () => {
    const snapshot = buildSnapshot();

    assert.equal(shouldDefaultGameMarketOrder(snapshot), true);
    assert.equal(isGameMoneylineBidReady(snapshot), true);
  });

  it("returns false when the game market is not accepting orders", () => {
    const snapshot = buildSnapshot({
      market: {
        volume: 1000,
        acceptingOrders: false,
        source: "polymarket",
        freshness: {
          source: "polymarket",
          status: "live"
        }
      }
    });

    assert.equal(shouldDefaultGameMarketOrder(snapshot), false);
    assert.equal(isGameMoneylineBidReady(snapshot), false);
  });
});
