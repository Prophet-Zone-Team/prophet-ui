import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyMatchTotalComboRulesToOdds,
  areMatchTotalSelectionsCompatible,
  areOverUnderLinesCompatible,
  removeConflictingMatchTotalPicks,
} from "@/lib/combo/match-total-combo-rules";
import type { ComboGameGroup } from "@/types/combo";

const sampleGroup: ComboGameGroup = {
  slug: "fifwc-fra-irq-2026-06-22",
  title: "France vs Iraq",
  kickoffLabel: "2026-06-22",
  homeTeam: { code: "FRA", name: "France" },
  awayTeam: { code: "IRQ", name: "Iraq" },
  markets: [
    {
      id: "fifwc-fra-irq-2026-06-22-total-2pt5",
      slug: "fifwc-fra-irq-2026-06-22-total-2pt5",
      title: "Total 2.5",
      outcomes: ["Over", "Under"],
      outcomePrices: ["0.5", "0.5"],
      conditionId: "c1",
      positionIds: ["p1", "p2"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-total-3pt5",
      slug: "fifwc-fra-irq-2026-06-22-total-3pt5",
      title: "Total 3.5",
      outcomes: ["Over", "Under"],
      outcomePrices: ["0.4", "0.6"],
      conditionId: "c2",
      positionIds: ["p3", "p4"],
    },
    {
      id: "fifwc-fra-irq-2026-06-22-total-5pt5",
      slug: "fifwc-fra-irq-2026-06-22-total-5pt5",
      title: "Total 5.5",
      outcomes: ["Over", "Under"],
      outcomePrices: ["0.2", "0.8"],
      conditionId: "c3",
      positionIds: ["p5", "p6"],
    },
  ],
};

const totalOdds = [
  {
    id: "fifwc-fra-irq-2026-06-22-total-2pt5:yes",
    label: "O 2.5",
    price: 0.5,
  },
  {
    id: "fifwc-fra-irq-2026-06-22-total-2pt5:no",
    label: "U 2.5",
    price: 0.5,
  },
  {
    id: "fifwc-fra-irq-2026-06-22-total-3pt5:yes",
    label: "O 3.5",
    price: 0.4,
  },
  {
    id: "fifwc-fra-irq-2026-06-22-total-3pt5:no",
    label: "U 3.5",
    price: 0.6,
  },
  {
    id: "fifwc-fra-irq-2026-06-22-total-5pt5:yes",
    label: "O 5.5",
    price: 0.2,
  },
  {
    id: "fifwc-fra-irq-2026-06-22-total-5pt5:no",
    label: "U 5.5",
    price: 0.8,
  },
];

describe("match total combo rules", () => {
  it("treats O 3.5 and U 5.5 as compatible", () => {
    assert.equal(areOverUnderLinesCompatible(3.5, 5.5), true);
    assert.equal(
      areMatchTotalSelectionsCompatible(
        { marketId: "a", line: 3.5, side: "over" },
        { marketId: "b", line: 5.5, side: "under" },
      ),
      true,
    );
  });

  it("treats O 3.5 and U 2.5 as incompatible", () => {
    assert.equal(areOverUnderLinesCompatible(3.5, 2.5), false);
  });

  it("disables a second over but keeps compatible unders when O 3.5 is selected", () => {
    const rules = applyMatchTotalComboRulesToOdds(
      totalOdds,
      [
        {
          id: "fifwc-fra-irq-2026-06-22-total-3pt5",
          outcomeSide: "yes",
        },
      ],
      sampleGroup,
      "Cannot add to combo",
    );

    assert.equal(rules.find((option) => option.label === "O 3.5")?.disabled, undefined);
    assert.equal(rules.find((option) => option.label === "U 3.5")?.disabled, undefined);
    assert.equal(rules.find((option) => option.label === "O 2.5")?.disabled, true);
    assert.equal(rules.find((option) => option.label === "U 5.5")?.disabled, undefined);
    assert.equal(rules.find((option) => option.label === "U 2.5")?.disabled, true);
  });

  it("allows O 3.5 and U 5.5 to remain selected together", () => {
    const groupPicks = [
      {
        id: "fifwc-fra-irq-2026-06-22-total-3pt5",
        outcomeSide: "yes",
      },
      {
        id: "fifwc-fra-irq-2026-06-22-total-5pt5",
        outcomeSide: "no",
      },
    ];

    const rules = applyMatchTotalComboRulesToOdds(
      totalOdds,
      groupPicks,
      sampleGroup,
      "Cannot add to combo",
    );

    assert.equal(rules.find((option) => option.label === "O 3.5")?.disabled, undefined);
    assert.equal(rules.find((option) => option.label === "U 5.5")?.disabled, undefined);
    assert.equal(rules.find((option) => option.label === "O 2.5")?.disabled, true);
    assert.equal(rules.find((option) => option.label === "O 5.5")?.disabled, true);
    assert.equal(rules.find((option) => option.label === "U 2.5")?.disabled, true);
  });

  it("removes only conflicting totals when adding a compatible under leg", () => {
    const overPick = {
      id: "fifwc-fra-irq-2026-06-22-total-3pt5",
      outcomeSide: "yes",
    };
    const underPick = {
      id: "fifwc-fra-irq-2026-06-22-total-5pt5",
      outcomeSide: "no",
    };

    const nextPicks = removeConflictingMatchTotalPicks(
      [overPick],
      sampleGroup,
      underPick.id,
      underPick.outcomeSide,
    );

    assert.deepEqual(nextPicks, [overPick]);
  });

  it("removes another over when selecting a different over line", () => {
    const overTwoPick = {
      id: "fifwc-fra-irq-2026-06-22-total-2pt5",
      outcomeSide: "yes",
    };
    const overThreePick = {
      id: "fifwc-fra-irq-2026-06-22-total-3pt5",
      outcomeSide: "yes",
    };

    const nextPicks = removeConflictingMatchTotalPicks(
      [overTwoPick],
      sampleGroup,
      overThreePick.id,
      overThreePick.outcomeSide,
    );

    assert.deepEqual(nextPicks, []);
  });
});
