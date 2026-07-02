import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isOutcomeSelected } from "@/views/trade/game/markets/fixture-market-actions";
import type { FixtureMarketOutcome } from "@/types/market";

function buildExtraTimeOutcome(
  overrides: Partial<FixtureMarketOutcome> = {},
): FixtureMarketOutcome {
  return {
    id: "extra_time:cond-1",
    marketType: "extra_time",
    category: "lines",
    label: "Yes",
    probability: 40,
    price: 0.4,
    tokenId: "yes-token",
    noTokenId: "no-token",
    ...overrides,
  };
}

function buildMoneylineOutcome(
  overrides: Partial<FixtureMarketOutcome> = {},
): FixtureMarketOutcome {
  return {
    id: "moneyline:home:cond-1",
    marketType: "moneyline",
    category: "lines",
    label: "ARG",
    side: "home",
    probability: 55,
    price: 0.55,
    tokenId: "yes-token",
    ...overrides,
  };
}

describe("fixture market actions", () => {
  it("matches binary side for single-outcome binary markets", () => {
    const outcome = buildExtraTimeOutcome();

    assert.equal(
      isOutcomeSelected(outcome, "yes", outcome.id, "yes"),
      true,
    );
    assert.equal(
      isOutcomeSelected(outcome, "no", outcome.id, "yes"),
      false,
    );
    assert.equal(
      isOutcomeSelected(outcome, "no", outcome.id, "no"),
      true,
    );
    assert.equal(
      isOutcomeSelected(outcome, "yes", outcome.id, "no"),
      false,
    );
  });

  it("ignores binary side for multi-outcome markets", () => {
    const outcome = buildMoneylineOutcome();

    assert.equal(
      isOutcomeSelected(outcome, "yes", outcome.id, "yes"),
      true,
    );
    assert.equal(
      isOutcomeSelected(outcome, "yes", outcome.id, "no"),
      true,
    );
    assert.equal(
      isOutcomeSelected(outcome, "yes", "other-id", "yes"),
      false,
    );
  });
});
