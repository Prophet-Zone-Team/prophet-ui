import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatMatchVersusTitle,
  resolveTradeWidgetHeaderIconKind,
  resolveTradeWidgetHeaderTitle
} from "@/lib/market/trade-widget-header";
import type { FixtureMarketOutcome } from "@/types/market";

function buildOutcome(
  overrides: Partial<FixtureMarketOutcome> & Pick<FixtureMarketOutcome, "marketType">
): FixtureMarketOutcome {
  return {
    id: "test",
    category: "lines",
    label: "Test",
    probability: 50,
    price: 0.5,
    ...overrides
  };
}

describe("trade widget header resolvers", () => {
  it("formats match versus title", () => {
    assert.equal(formatMatchVersusTitle("Mexico", "South Africa"), "Mexico vs South Africa");
  });

  it("maps market types to header titles", () => {
    const home = "Mexico";
    const away = "South Africa";

    assert.equal(resolveTradeWidgetHeaderTitle(null, home, away), "Mexico vs South Africa");
    assert.equal(
      resolveTradeWidgetHeaderTitle(buildOutcome({ marketType: "moneyline" }), home, away),
      "Mexico vs South Africa"
    );
    assert.equal(
      resolveTradeWidgetHeaderTitle(buildOutcome({ marketType: "spread" }), home, away),
      "Spreads"
    );
    assert.equal(
      resolveTradeWidgetHeaderTitle(buildOutcome({ marketType: "total" }), home, away),
      "Totals"
    );
    assert.equal(
      resolveTradeWidgetHeaderTitle(buildOutcome({ marketType: "btts" }), home, away),
      "Both Teams to Score?"
    );
    assert.equal(
      resolveTradeWidgetHeaderTitle(buildOutcome({ marketType: "exact_score" }), home, away),
      "Exact Score"
    );
    assert.equal(
      resolveTradeWidgetHeaderTitle(buildOutcome({ marketType: "halftime" }), home, away),
      "Half-time Result"
    );
  });

  it("resolves moneyline and halftime icons from outcome side", () => {
    assert.deepEqual(
      resolveTradeWidgetHeaderIconKind(
        buildOutcome({ marketType: "moneyline", side: "home" }),
        "away",
        "yes"
      ),
      { kind: "team", side: "home" }
    );
    assert.deepEqual(
      resolveTradeWidgetHeaderIconKind(
        buildOutcome({ marketType: "moneyline", side: "draw" }),
        "home",
        "yes"
      ),
      { kind: "draw" }
    );
    assert.deepEqual(
      resolveTradeWidgetHeaderIconKind(
        buildOutcome({ marketType: "halftime", side: "away" }),
        "home",
        "yes"
      ),
      { kind: "team", side: "away" }
    );
  });

  it("resolves spread icons from outcome side", () => {
    assert.deepEqual(
      resolveTradeWidgetHeaderIconKind(
        buildOutcome({ marketType: "spread", side: "home" }),
        "away",
        "yes"
      ),
      { kind: "team", side: "home" }
    );
  });

  it("hides icon for exact score", () => {
    assert.deepEqual(
      resolveTradeWidgetHeaderIconKind(
        buildOutcome({ marketType: "exact_score" }),
        "home",
        "yes"
      ),
      { kind: "none" }
    );
  });

  it("falls back to match outcome side when no fixture outcome is selected", () => {
    assert.deepEqual(resolveTradeWidgetHeaderIconKind(null, "draw", "yes"), {
      kind: "draw"
    });
    assert.deepEqual(resolveTradeWidgetHeaderIconKind(null, "away", "yes"), {
      kind: "team",
      side: "away"
    });
  });

  it("highlights total over/under split from outcome side and binary side", () => {
    assert.deepEqual(
      resolveTradeWidgetHeaderIconKind(
        buildOutcome({ marketType: "total", side: "over" }),
        "home",
        "yes"
      ),
      { kind: "split", variant: "over_under", activeSide: "left" }
    );
    assert.deepEqual(
      resolveTradeWidgetHeaderIconKind(
        buildOutcome({ marketType: "total", side: "under" }),
        "home",
        "yes"
      ),
      { kind: "split", variant: "over_under", activeSide: "right" }
    );
    assert.deepEqual(
      resolveTradeWidgetHeaderIconKind(
        buildOutcome({ marketType: "total", side: "over" }),
        "home",
        "no"
      ),
      { kind: "split", variant: "over_under", activeSide: "right" }
    );
  });

  it("highlights btts yes/no split from binary side", () => {
    assert.deepEqual(
      resolveTradeWidgetHeaderIconKind(buildOutcome({ marketType: "btts" }), "home", "yes"),
      { kind: "split", variant: "yes_no", activeSide: "left" }
    );
    assert.deepEqual(
      resolveTradeWidgetHeaderIconKind(buildOutcome({ marketType: "btts" }), "home", "no"),
      { kind: "split", variant: "yes_no", activeSide: "right" }
    );
  });
});
