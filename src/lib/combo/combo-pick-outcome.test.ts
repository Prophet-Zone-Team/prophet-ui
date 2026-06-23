import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isHalftimeTeamMarket,
  isMatchMoneylineTeamMarket,
  resolveComboLegOutcomeSide,
  resolveComboPickStoredOutcomeSide,
  resolveHalftimeTeamMarket,
  resolveMatchMoneylineMarket,
} from "@/lib/combo/combo-pick-outcome";
import type { ComboGameGroup, ComboMarketRecord } from "@/types/combo";

const group: ComboGameGroup = {
  slug: "fifwc-fra-irq-2026-06-22",
  title: "France vs Iraq",
  kickoffLabel: "2026-06-22",
  homeTeam: { name: "France", code: "FRA" },
  awayTeam: { name: "Iraq", code: "IRQ" },
  markets: [
    {
      id: "fifwc-fra-irq-2026-06-22-fra",
      slug: "fifwc-fra-irq-2026-06-22-fra",
      title: "France",
      outcomes: ["France", "No"],
      outcomePrices: ["0.8", "0.2"],
      conditionId: "ml-home",
      positionIds: ["pos-home-yes", "pos-home-no"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-draw",
      slug: "fifwc-fra-irq-2026-06-22-draw",
      title: "Draw",
      outcomes: ["Draw", "No"],
      outcomePrices: ["0.1", "0.9"],
      conditionId: "ml-draw",
      positionIds: ["pos-draw-yes", "pos-draw-no"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-irq",
      slug: "fifwc-fra-irq-2026-06-22-irq",
      title: "Iraq",
      outcomes: ["Iraq", "No"],
      outcomePrices: ["0.1", "0.9"],
      conditionId: "ml-away",
      positionIds: ["pos-away-yes", "pos-away-no"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-halftime-result-fra",
      slug: "fifwc-fra-irq-2026-06-22-halftime-result-fra",
      title: "HT France",
      outcomes: ["Yes", "No"],
      outcomePrices: ["0.5", "0.5"],
      conditionId: "ht-home",
      positionIds: ["pos-ht-home-yes", "pos-ht-home-no"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-halftime-result-irq",
      slug: "fifwc-fra-irq-2026-06-22-halftime-result-irq",
      title: "HT Iraq",
      outcomes: ["Yes", "No"],
      outcomePrices: ["0.2", "0.8"],
      conditionId: "ht-away",
      positionIds: ["pos-ht-away-yes", "pos-ht-away-no"],
    },
  ],
};

const homeMarket = group.markets[0];
const awayMarket = group.markets[2];
const halftimeHomeMarket = group.markets[3];
const halftimeAwayMarket = group.markets[4];

const totalMarket: ComboMarketRecord = {
  id: "fifwc-fra-irq-2026-06-22-total-2pt5",
  slug: "fifwc-fra-irq-2026-06-22-total-2pt5",
  title: "France vs Iraq: O/U 2.5",
  outcomes: ["Yes", "No"],
  outcomePrices: ["0.5", "0.5"],
  conditionId: "total",
  positionIds: ["pos-over", "pos-under"],
};

describe("combo pick outcome", () => {
  it("identifies home and away moneyline markets", () => {
    assert.equal(isMatchMoneylineTeamMarket(homeMarket), true);
    assert.equal(isMatchMoneylineTeamMarket(awayMarket), true);
    assert.equal(isMatchMoneylineTeamMarket(group.markets[1]), false);
  });

  it("stores toggle side consistently for team moneyline", () => {
    assert.equal(
      resolveComboPickStoredOutcomeSide(homeMarket, "yes"),
      "yes",
    );
    assert.equal(
      resolveComboPickStoredOutcomeSide(awayMarket, "yes"),
      "no",
    );
    assert.equal(
      resolveComboPickStoredOutcomeSide(awayMarket, "no"),
      "no",
    );
  });

  it("stores toggle side consistently for match totals", () => {
    assert.equal(resolveComboPickStoredOutcomeSide(totalMarket, "yes"), "yes");
    assert.equal(resolveComboPickStoredOutcomeSide(totalMarket, "no"), "no");
  });

  it("normalizes team moneyline legs to yes while keeping stored toggle", () => {
    assert.equal(resolveComboLegOutcomeSide(homeMarket, "yes"), "yes");
    assert.equal(resolveComboLegOutcomeSide(awayMarket, "no"), "yes");
    assert.equal(resolveComboLegOutcomeSide(totalMarket, "no"), "no");
  });

  it("resolves home and away markets from a game group", () => {
    assert.equal(resolveMatchMoneylineMarket(group, "home")?.id, homeMarket.id);
    assert.equal(resolveMatchMoneylineMarket(group, "away")?.id, awayMarket.id);
    assert.equal(
      resolveHalftimeTeamMarket(group, "home")?.id,
      halftimeHomeMarket.id,
    );
    assert.equal(
      resolveHalftimeTeamMarket(group, "away")?.id,
      halftimeAwayMarket.id,
    );
  });

  it("stores toggle side consistently for halftime team markets", () => {
    assert.equal(
      resolveComboPickStoredOutcomeSide(halftimeHomeMarket, "yes"),
      "yes",
    );
    assert.equal(
      resolveComboPickStoredOutcomeSide(halftimeAwayMarket, "yes"),
      "no",
    );
    assert.equal(isHalftimeTeamMarket(halftimeHomeMarket), true);
    assert.equal(resolveComboLegOutcomeSide(halftimeAwayMarket, "no"), "yes");
  });
});
