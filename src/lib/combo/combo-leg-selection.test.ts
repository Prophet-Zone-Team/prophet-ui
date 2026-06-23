import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyComboLegSelectionRules,
  exactScoreMatchesMoneylineSide,
  filterExactScoreOddsByMoneylineSide,
  resolveMoneylineSide,
  resolveSelectedMoneylineSideFromGroupPicks,
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
      id: "fifwc-fra-irq-2026-06-22-fra",
      slug: "fifwc-fra-irq-2026-06-22-fra",
      title: "France",
      outcomes: ["Yes", "No"],
      outcomePrices: ["0.8", "0.2"],
      conditionId: "ml1",
      positionIds: ["p1", "p2"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-draw",
      slug: "fifwc-fra-irq-2026-06-22-draw",
      title: "Draw",
      outcomes: ["Yes", "No"],
      outcomePrices: ["0.1", "0.9"],
      conditionId: "ml2",
      positionIds: ["p3", "p4"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-irq",
      slug: "fifwc-fra-irq-2026-06-22-irq",
      title: "Iraq",
      outcomes: ["Yes", "No"],
      outcomePrices: ["0.1", "0.9"],
      conditionId: "ml3",
      positionIds: ["p5", "p6"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-total-3pt5",
      slug: "fifwc-fra-irq-2026-06-22-total-3pt5",
      title: "Total 3.5",
      outcomes: ["Over", "Under"],
      outcomePrices: ["0.4", "0.6"],
      conditionId: "c1",
      positionIds: ["p7", "p8"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-total-5pt5",
      slug: "fifwc-fra-irq-2026-06-22-total-5pt5",
      title: "Total 5.5",
      outcomes: ["Over", "Under"],
      outcomePrices: ["0.2", "0.8"],
      conditionId: "c2",
      positionIds: ["p9", "p10"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-spread-fra-1pt5",
      slug: "fifwc-fra-irq-2026-06-22-spread-fra-1pt5",
      title: "France -1.5",
      outcomes: ["Yes", "No"],
      outcomePrices: ["0.5", "0.5"],
      conditionId: "sp1",
      positionIds: ["p11", "p12"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-exact-score-1-0",
      slug: "fifwc-fra-irq-2026-06-22-exact-score-1-0",
      title: "1-0",
      outcomes: ["Yes", "No"],
      outcomePrices: ["0.1", "0.9"],
      conditionId: "es1",
      positionIds: ["p13", "p14"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-exact-score-2-1",
      slug: "fifwc-fra-irq-2026-06-22-exact-score-2-1",
      title: "2-1",
      outcomes: ["Yes", "No"],
      outcomePrices: ["0.08", "0.92"],
      conditionId: "es2",
      positionIds: ["p15", "p16"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-halftime-result-fra",
      slug: "fifwc-fra-irq-2026-06-22-halftime-result-fra",
      title: "HT France",
      outcomes: ["Yes", "No"],
      outcomePrices: ["0.5", "0.5"],
      conditionId: "ht1",
      positionIds: ["p17", "p18"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-halftime-result-draw",
      slug: "fifwc-fra-irq-2026-06-22-halftime-result-draw",
      title: "HT Draw",
      outcomes: ["Yes", "No"],
      outcomePrices: ["0.3", "0.7"],
      conditionId: "ht2",
      positionIds: ["p19", "p20"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-halftime-result-irq",
      slug: "fifwc-fra-irq-2026-06-22-halftime-result-irq",
      title: "HT Iraq",
      outcomes: ["Yes", "No"],
      outcomePrices: ["0.2", "0.8"],
      conditionId: "ht3",
      positionIds: ["p21", "p22"],
    },
  ],
};

const moneylinePick = {
  id: "fifwc-fra-irq-2026-06-22-fra",
  type: "moneyline" as const,
  outcomeSide: "yes" as const,
  matchupLabel: "France vs Iraq",
  team: { name: "France", code: "FRA" },
  selectionLabel: "France",
  legPositionId: "leg-ml",
  referencePrice: 0.8,
};

const totalPick = {
  id: "fifwc-fra-irq-2026-06-22-total-3pt5",
  type: "moneyline" as const,
  outcomeSide: "yes" as const,
  matchupLabel: "Total 3.5",
  team: { name: "O/U", code: "O/U" },
  selectionLabel: "Over",
  legPositionId: "leg-total",
  referencePrice: 0.4,
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

  it("resolves moneyline side from group picks even when total is listed first", () => {
    assert.equal(
      resolveSelectedMoneylineSideFromGroupPicks(
        [totalPick, moneylinePick],
        sampleGroup,
      ),
      "home",
    );
  });

  it("disables other moneyline options when one side is selected", () => {
    const moneylineOdds = [
      { id: "fifwc-fra-irq-2026-06-22-fra:yes", label: "France", price: 0.8 },
      { id: "fifwc-fra-irq-2026-06-22-draw:yes", label: "Draw", price: 0.1 },
      { id: "fifwc-fra-irq-2026-06-22-irq:yes", label: "Iraq", price: 0.1 },
    ];

    const rules = applyComboLegSelectionRules({
      moneylineOdds,
      halftimeOdds: [],
      spreadOdds: [],
      topScoreOdds: [],
      totalOdds: [],
      groupPicks: [moneylinePick],
      group: sampleGroup,
      disabledTooltip: "Cannot add to combo",
    });

    assert.equal(rules.moneylineOdds[0]?.disabled, undefined);
    assert.equal(rules.moneylineOdds[1]?.disabled, true);
    assert.equal(rules.moneylineOdds[2]?.disabled, true);
  });

  it("disables spreads when moneyline is selected", () => {
    const rules = applyComboLegSelectionRules({
      moneylineOdds: [],
      halftimeOdds: [],
      spreadOdds: [
        {
          id: "fifwc-fra-irq-2026-06-22-spread-fra-1pt5:yes",
          label: "FRA -1.5",
          price: 0.5,
        },
      ],
      topScoreOdds: [],
      totalOdds: [],
      groupPicks: [moneylinePick],
      group: sampleGroup,
      disabledTooltip: "Cannot add to combo",
    });

    assert.equal(rules.spreadOdds[0]?.disabled, true);
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
      halftimeOdds: [],
      spreadOdds: [],
      topScoreOdds: [],
      totalOdds,
      groupPicks: [totalPick],
      group: sampleGroup,
      disabledTooltip: "Cannot add to combo",
    });

    assert.equal(rules.totalOdds[0]?.disabled, undefined);
    assert.equal(rules.totalOdds[1]?.disabled, undefined);
  });

  it("disables other exact score options when one score is selected", () => {
    const rules = applyComboLegSelectionRules({
      moneylineOdds: [],
      halftimeOdds: [],
      spreadOdds: [],
      topScoreOdds: [
        {
          id: "fifwc-fra-irq-2026-06-22-exact-score-1-0:yes",
          label: "1-0",
          price: 0.1,
        },
        {
          id: "fifwc-fra-irq-2026-06-22-exact-score-2-1:yes",
          label: "2-1",
          price: 0.08,
        },
      ],
      totalOdds: [],
      groupPicks: [
        {
          ...moneylinePick,
          id: "fifwc-fra-irq-2026-06-22-exact-score-1-0",
        },
      ],
      group: sampleGroup,
      disabledTooltip: "Cannot add to combo",
    });

    assert.equal(rules.topScoreOdds[0]?.disabled, undefined);
    assert.equal(rules.topScoreOdds[1]?.disabled, true);
  });

  it("disables other halftime options when one side is selected", () => {
    const halftimeOdds = [
      {
        id: "fifwc-fra-irq-2026-06-22-halftime-result-fra:yes",
        label: "FRA",
        price: 0.5,
      },
      {
        id: "fifwc-fra-irq-2026-06-22-halftime-result-draw:yes",
        label: "Draw",
        price: 0.3,
      },
      {
        id: "fifwc-fra-irq-2026-06-22-halftime-result-irq:yes",
        label: "IRQ",
        price: 0.2,
      },
    ];

    const rules = applyComboLegSelectionRules({
      moneylineOdds: [],
      halftimeOdds,
      spreadOdds: [],
      topScoreOdds: [],
      totalOdds: [],
      groupPicks: [
        {
          id: "fifwc-fra-irq-2026-06-22-halftime-result-fra",
          type: "moneyline",
          outcomeSide: "yes",
          matchupLabel: "HT France",
          team: { name: "HT France", code: "FRA" },
          selectionLabel: "France",
          legPositionId: "leg-ht",
          referencePrice: 0.5,
        },
      ],
      group: sampleGroup,
      disabledTooltip: "Cannot add to combo",
    });

    assert.equal(rules.halftimeOdds[0]?.disabled, undefined);
    assert.equal(rules.halftimeOdds[1]?.disabled, true);
    assert.equal(rules.halftimeOdds[2]?.disabled, true);
  });
});
