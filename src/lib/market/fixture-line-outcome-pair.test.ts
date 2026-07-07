import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isLineDualOutcomeMarket,
  resolveLineKeyFromOutcome,
  resolveLineOutcomeForSide,
  resolveLineOutcomePair,
  resolveLineOutcomeTradeBinarySide,
  resolveLineOutcomeTradeTokenId,
} from "@/lib/market/fixture-line-outcome-pair";
import type {
  FixtureMarketGroup,
  FixtureMarketOutcome,
  GameFixtureMarketsSnapshot,
} from "@/types/market";

function buildSpreadOutcome(
  overrides: Partial<FixtureMarketOutcome> & Pick<FixtureMarketOutcome, "id" | "side">,
): FixtureMarketOutcome {
  return {
    marketType: "spread",
    category: "lines",
    label: "Test",
    probability: 50,
    price: 0.5,
    conditionId: "cond-1",
    tokenId: "yes-token",
    noTokenId: "no-token",
    line: 1.5,
    ...overrides,
  };
}

function buildTotalOutcome(
  overrides: Partial<FixtureMarketOutcome> & Pick<FixtureMarketOutcome, "id" | "side">,
): FixtureMarketOutcome {
  return {
    marketType: "total",
    category: "lines",
    label: "Test",
    probability: 50,
    price: 0.5,
    tokenId: "yes-token",
    noTokenId: "no-token",
    line: 2.5,
    ...overrides,
  };
}

function buildTeamAdvanceOutcome(
  overrides: Partial<FixtureMarketOutcome> & Pick<FixtureMarketOutcome, "id" | "side">,
): FixtureMarketOutcome {
  return {
    marketType: "team_to_advance",
    category: "lines",
    label: "Test",
    probability: 50,
    price: 0.5,
    tokenId: "yes-token",
    ...overrides,
  };
}

describe("fixture line outcome pair", () => {
  it("detects spread and total dual-outcome markets", () => {
    assert.equal(
      isLineDualOutcomeMarket(buildSpreadOutcome({ id: "spread:cond-1:yes", side: "home" })),
      true,
    );
    assert.equal(
      isLineDualOutcomeMarket(buildTotalOutcome({ id: "total:2.5:over", side: "over" })),
      true,
    );
    assert.equal(isLineDualOutcomeMarket({ marketType: "moneyline" }), false);
    assert.equal(
      isLineDualOutcomeMarket(
        buildTeamAdvanceOutcome({ id: "team_to_advance:home:cond-1", side: "home" }),
      ),
      true,
    );
  });

  it("resolves spread line keys from outcome ids or condition ids", () => {
    const spreadOutcome = buildSpreadOutcome({
      id: "spread:cond-1:yes",
      side: "home",
      label: "ARG +1.5",
    });

    assert.equal(resolveLineKeyFromOutcome(spreadOutcome), "spread:cond-1");
  });

  it("resolves total line keys from outcome line or id", () => {
    const totalOutcome = buildTotalOutcome({
      id: "total:2.5:under",
      side: "under",
      label: "U 2.5",
    });

    assert.equal(resolveLineKeyFromOutcome(totalOutcome), "2.5");
  });

  it("maps spread widget buttons to home and away display order", () => {
    const spreadGroup: FixtureMarketGroup = {
      type: "spread",
      title: "Spreads",
      defaultLineKey: "spread:cond-1",
      outcomesByLine: {
        "spread:cond-1": [
          buildSpreadOutcome({
            id: "spread:cond-1:no",
            side: "home",
            label: "ARG +1.5",
          }),
          buildSpreadOutcome({
            id: "spread:cond-1:yes",
            side: "away",
            label: "AUS -1.5",
          }),
        ],
      },
      outcomes: [],
    };

    const fixtureMarkets: Pick<GameFixtureMarketsSnapshot, "lines"> = {
      lines: [spreadGroup],
    };

    const pair = resolveLineOutcomePair(
      buildSpreadOutcome({
        id: "spread:cond-1:no",
        side: "home",
        label: "ARG +1.5",
      }),
      fixtureMarkets,
    );

    assert.equal(pair?.yesOutcome.label, "ARG +1.5");
    assert.equal(pair?.noOutcome.label, "AUS -1.5");
    assert.equal(resolveLineOutcomeForSide(pair!, "yes").id, "spread:cond-1:no");
    assert.equal(resolveLineOutcomeForSide(pair!, "no").id, "spread:cond-1:yes");
  });

  it("returns home/away spread outcomes when home is favored", () => {
    const spreadGroup: FixtureMarketGroup = {
      type: "spread",
      title: "Spreads",
      defaultLineKey: "spread:cond-1",
      outcomesByLine: {
        "spread:cond-1": [
          buildSpreadOutcome({
            id: "spread:cond-1:yes",
            side: "home",
            label: "ARG +1.5",
          }),
          buildSpreadOutcome({
            id: "spread:cond-1:no",
            side: "away",
            label: "AUS -1.5",
          }),
        ],
      },
      outcomes: [],
    };

    const fixtureMarkets: Pick<GameFixtureMarketsSnapshot, "lines"> = {
      lines: [spreadGroup],
    };

    const pair = resolveLineOutcomePair(
      buildSpreadOutcome({
        id: "spread:cond-1:no",
        side: "away",
        label: "AUS -1.5",
      }),
      fixtureMarkets,
    );

    assert.equal(pair?.yesOutcome.label, "ARG +1.5");
    assert.equal(pair?.noOutcome.label, "AUS -1.5");
    assert.equal(resolveLineOutcomeForSide(pair!, "yes").id, "spread:cond-1:yes");
    assert.equal(resolveLineOutcomeForSide(pair!, "no").id, "spread:cond-1:no");
  });

  it("maps spread trade token ids from outcome suffix when home is underdog", () => {
    const homeUnderdog = buildSpreadOutcome({
      id: "spread:cond-1:no",
      side: "home",
      label: "CUR +1.5",
      tokenId: "yes-token",
      noTokenId: "no-token",
    });
    const awayFavorite = buildSpreadOutcome({
      id: "spread:cond-1:yes",
      side: "away",
      label: "COT -1.5",
      tokenId: "yes-token",
      noTokenId: "no-token",
    });

    assert.equal(resolveLineOutcomeTradeBinarySide(homeUnderdog), "no");
    assert.equal(resolveLineOutcomeTradeBinarySide(awayFavorite), "yes");
    assert.equal(resolveLineOutcomeTradeTokenId(homeUnderdog), "no-token");
    assert.equal(resolveLineOutcomeTradeTokenId(awayFavorite), "yes-token");
  });

  it("maps spread trade token ids from outcome suffix when home is favorite", () => {
    const homeFavorite = buildSpreadOutcome({
      id: "spread:cond-1:yes",
      side: "home",
      label: "CUR -1.5",
      tokenId: "yes-token",
      noTokenId: "no-token",
    });
    const awayUnderdog = buildSpreadOutcome({
      id: "spread:cond-1:no",
      side: "away",
      label: "COT +1.5",
      tokenId: "yes-token",
      noTokenId: "no-token",
    });

    assert.equal(resolveLineOutcomeTradeBinarySide(homeFavorite), "yes");
    assert.equal(resolveLineOutcomeTradeBinarySide(awayUnderdog), "no");
    assert.equal(resolveLineOutcomeTradeTokenId(homeFavorite), "yes-token");
    assert.equal(resolveLineOutcomeTradeTokenId(awayUnderdog), "no-token");
  });

  it("returns over/under total outcomes for the selected line", () => {
    const totalGroup: FixtureMarketGroup = {
      type: "total",
      title: "Totals",
      defaultLineKey: "2.5",
      outcomesByLine: {
        "2.5": [
          buildTotalOutcome({
            id: "total:2.5:over",
            side: "over",
            label: "O 2.5",
          }),
          buildTotalOutcome({
            id: "total:2.5:under",
            side: "under",
            label: "U 2.5",
          }),
        ],
      },
      outcomes: [],
    };

    const fixtureMarkets: Pick<GameFixtureMarketsSnapshot, "lines"> = {
      lines: [totalGroup],
    };

    const pair = resolveLineOutcomePair(
      buildTotalOutcome({
        id: "total:2.5:over",
        side: "over",
        label: "O 2.5",
      }),
      fixtureMarkets,
    );

    assert.equal(pair?.yesOutcome.side, "over");
    assert.equal(pair?.noOutcome.side, "under");
  });

  it("maps team to advance widget buttons to home and away outcomes", () => {
    const advanceGroup: FixtureMarketGroup = {
      type: "team_to_advance",
      title: "Team to Advance",
      outcomes: [
        buildTeamAdvanceOutcome({
          id: "team_to_advance:away:cond-2",
          side: "away",
          label: "AUS",
        }),
        buildTeamAdvanceOutcome({
          id: "team_to_advance:home:cond-1",
          side: "home",
          label: "ARG",
        }),
      ],
    };

    const fixtureMarkets: Pick<GameFixtureMarketsSnapshot, "lines"> = {
      lines: [advanceGroup],
    };

    const pair = resolveLineOutcomePair(
      buildTeamAdvanceOutcome({
        id: "team_to_advance:home:cond-1",
        side: "home",
        label: "ARG",
      }),
      fixtureMarkets,
    );

    assert.equal(pair?.yesOutcome.label, "ARG");
    assert.equal(pair?.noOutcome.label, "AUS");
    assert.equal(resolveLineOutcomeForSide(pair!, "yes").side, "home");
    assert.equal(resolveLineOutcomeForSide(pair!, "no").side, "away");
  });

  it("falls back to index order for team to advance when sides are missing", () => {
    const advanceGroup: FixtureMarketGroup = {
      type: "team_to_advance",
      title: "Team to Advance",
      outcomes: [
        buildTeamAdvanceOutcome({
          id: "team_to_advance:cond-1:0",
          side: undefined,
          label: "ARG",
        }),
        buildTeamAdvanceOutcome({
          id: "team_to_advance:cond-2:1",
          side: undefined,
          label: "AUS",
        }),
      ],
    };

    const fixtureMarkets: Pick<GameFixtureMarketsSnapshot, "lines"> = {
      lines: [advanceGroup],
    };

    const pair = resolveLineOutcomePair(
      buildTeamAdvanceOutcome({
        id: "team_to_advance:cond-1:0",
        side: undefined,
        label: "ARG",
      }),
      fixtureMarkets,
    );

    assert.equal(pair?.yesOutcome.label, "ARG");
    assert.equal(pair?.noOutcome.label, "AUS");
  });
});
