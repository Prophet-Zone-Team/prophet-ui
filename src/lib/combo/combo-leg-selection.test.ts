import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyComboLegSelectionRules,
  exactScoreMatchesMoneylineSide,
  filterExactScoreOddsByMoneylineSide,
  resolveMoneylineSide,
} from "@/lib/combo/combo-leg-selection";
import type { ComboGameGroup } from "@/types/combo";

const sampleGroup: ComboGameGroup = {
  slug: "fifwc-fra-irq-2026-06-22",
  title: "France vs Iraq",
  kickoffLabel: "2026-06-22",
  homeTeam: { code: "FRA", name: "France" },
  awayTeam: { code: "IRQ", name: "Iraq" },
  markets: [
    {
      id: "fifwc-fra-irq-2026-06-22-total-3pt5",
      slug: "fifwc-fra-irq-2026-06-22-total-3pt5",
      title: "Total 3.5",
      outcomes: ["Over", "Under"],
      outcomePrices: ["0.4", "0.6"],
      conditionId: "c1",
      positionIds: ["p1", "p2"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-total-5pt5",
      slug: "fifwc-fra-irq-2026-06-22-total-5pt5",
      title: "Total 5.5",
      outcomes: ["Over", "Under"],
      outcomePrices: ["0.2", "0.8"],
      conditionId: "c2",
      positionIds: ["p3", "p4"],
    },
  ],
};

describe("combo leg selection", () => {
  it("resolves moneyline sides from pick codes", () => {
    assert.equal(resolveMoneylineSide("draw", "cze", "rsa"), "draw");
    assert.equal(resolveMoneylineSide("cze", "cze", "rsa"), "home");
    assert.equal(resolveMoneylineSide("rsa", "cze", "rsa"), "away");
  });

  it("filters exact scores by selected moneyline side", () => {
    const odds = [
      { id: "1:yes", label: "1-0", price: 0.1 },
      { id: "2:yes", label: "1-1", price: 0.12 },
      { id: "3:yes", label: "0-1", price: 0.08 },
      { id: "4:yes", label: "Any Other", price: 0.2 },
    ];

    assert.deepEqual(
      filterExactScoreOddsByMoneylineSide(odds, "home").map((entry) => entry.label),
      ["1-0", "Any Other"],
    );
    assert.deepEqual(
      filterExactScoreOddsByMoneylineSide(odds, "draw").map((entry) => entry.label),
      ["1-1", "Any Other"],
    );
    assert.deepEqual(
      filterExactScoreOddsByMoneylineSide(odds, "away").map((entry) => entry.label),
      ["0-1", "Any Other"],
    );
  });

  it("matches exact score labels to moneyline sides", () => {
    assert.equal(exactScoreMatchesMoneylineSide("2-1", "home"), true);
    assert.equal(exactScoreMatchesMoneylineSide("2-1", "draw"), false);
    assert.equal(exactScoreMatchesMoneylineSide("1-1", "draw"), true);
    assert.equal(exactScoreMatchesMoneylineSide("0-2", "away"), true);
    assert.equal(exactScoreMatchesMoneylineSide("Any Other", "away"), true);
  });

  it("keeps compatible unders enabled when O 3.5 is selected", () => {
    const totalOdds = [
      {
        id: "fifwc-fra-irq-2026-06-22-total-3pt5:yes",
        label: "O 3.5",
        price: 0.4,
      },
      {
        id: "fifwc-fra-irq-2026-06-22-total-5pt5:no",
        label: "U 5.5",
        price: 0.8,
      },
    ];

    const rules = applyComboLegSelectionRules({
      moneylineOdds: [],
      spreadOdds: [],
      topScoreOdds: [],
      totalOdds,
      groupPicks: [
        {
          id: "fifwc-fra-irq-2026-06-22-total-3pt5",
          type: "moneyline",
          outcomeSide: "yes",
          matchupLabel: "Total 3.5",
          team: { name: "O/U", code: "O/U" },
          selectionLabel: "Over",
          legPositionId: "leg-1",
          referencePrice: 0.4,
        },
      ],
      group: sampleGroup,
      disabledTooltip: "Cannot add to combo",
    });

    assert.equal(rules.totalOdds[0]?.disabled, undefined);
    assert.equal(rules.totalOdds[1]?.disabled, undefined);
  });
});
