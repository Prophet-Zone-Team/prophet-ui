import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveFixtureChartTokens } from "@/lib/market/fixture-chart-tokens";
import type { FixtureMarketOutcome, WorldCupMatch } from "@/types/market";

const YES_TOKEN = "yes-token";
const NO_TOKEN = "no-token";
const LINE_KEY = "spread:condition-1";

function buildSpreadOutcome(input: {
  idSuffix: "yes" | "no";
  side: "home" | "away";
}): FixtureMarketOutcome {
  return {
    id: `${LINE_KEY}:${input.idSuffix}`,
    marketType: "spread",
    category: "lines",
    label: input.side,
    side: input.side,
    probability: input.idSuffix === "yes" ? 4 : 96,
    price: input.idSuffix === "yes" ? 0.04 : 0.96,
    tokenId: YES_TOKEN,
    noTokenId: NO_TOKEN,
    conditionId: "condition-1",
  };
}

function buildSpreadMatch(favoredSide: "home" | "away"): WorldCupMatch {
  const yesOutcome = buildSpreadOutcome({
    idSuffix: "yes",
    side: favoredSide,
  });
  const noOutcome = buildSpreadOutcome({
    idSuffix: "no",
    side: favoredSide === "home" ? "away" : "home",
  });
  const outcomes = [yesOutcome, noOutcome];

  return {
    id: "test-match",
    matchId: 1,
    stage: "GROUP",
    status: "scheduled",
    polymarket: {
      eventId: "event-1",
      slug: "test-match",
      moneyline: {
        outcomes: [],
      },
      fixtureMarkets: {
        lines: [
          {
            type: "spread",
            title: "Spread",
            defaultLineKey: LINE_KEY,
            outcomesByLine: {
              [LINE_KEY]: outcomes,
            },
            outcomes,
          },
        ],
        exactScores: [],
        halftime: [],
      },
    },
  };
}

describe("resolveFixtureChartTokens", () => {
  it("maps spread chart tokens to each side's YES/NO leg when home is favored", () => {
    const resolution = resolveFixtureChartTokens(
      buildSpreadMatch("home"),
      "spread",
      LINE_KEY,
    );

    assert.equal(resolution?.mode, "binary");
    assert.deepEqual(resolution?.inputs, [
      { key: "primary", tokenId: YES_TOKEN },
      { key: "secondary", tokenId: NO_TOKEN },
    ]);
  });

  it("maps spread chart tokens to each side's YES/NO leg when away is favored", () => {
    const resolution = resolveFixtureChartTokens(
      buildSpreadMatch("away"),
      "spread",
      LINE_KEY,
    );

    assert.equal(resolution?.mode, "binary");
    assert.deepEqual(resolution?.inputs, [
      { key: "primary", tokenId: NO_TOKEN },
      { key: "secondary", tokenId: YES_TOKEN },
    ]);
  });
});
