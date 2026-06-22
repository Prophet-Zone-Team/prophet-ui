import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  mapComboGameToItemProps,
  resolveDefaultComboMatchTotalPreviewOdds,
} from "@/lib/combo/map-market-to-combo-item";
import type { ComboGameGroup } from "@/types/combo";
import { isComboOddsOptionSelected } from "@/views/combo/combo-item/selection";

describe("resolveDefaultComboMatchTotalPreviewOdds", () => {
  it("returns the default line over/under pair when multiple lines exist", () => {
    const totalOdds = [
      { id: "1:yes", label: "O 1.5", price: 0.4 },
      { id: "1:no", label: "U 1.5", price: 0.6 },
      { id: "2:yes", label: "O 2.5", price: 0.45 },
      { id: "2:no", label: "U 2.5", price: 0.55 },
      { id: "3:yes", label: "O 3.5", price: 0.3 },
      { id: "3:no", label: "U 3.5", price: 0.7 },
    ];

    assert.deepEqual(
      resolveDefaultComboMatchTotalPreviewOdds(totalOdds).map((option) => option.label),
      ["O 2.5", "U 2.5"],
    );
  });
});

describe("mapComboGameToItemProps spread labels", () => {
  const group: ComboGameGroup = {
    slug: "fifwc-arg-aut-2026-06-22",
    title: "Argentina vs Austria",
    kickoffLabel: "2026-06-22",
    homeTeam: { name: "Argentina", code: "ARG" },
    awayTeam: { name: "Austria", code: "AUT" },
    markets: [
      {
        id: "spread-home",
        slug: "fifwc-arg-aut-2026-06-22-spread-home-1pt5",
        title: "Argentina -1.5",
        outcomes: ["Yes", "No"],
        outcomePrices: ["0.5", "0.5"],
      },
      {
        id: "spread-away",
        slug: "fifwc-arg-aut-2026-06-22-spread-away-1pt5",
        title: "Austria +1.5",
        outcomes: ["Yes", "No"],
        outcomePrices: ["0.5", "0.5"],
      },
    ],
  };

  it("maps spread-home and spread-away slugs to team codes", () => {
    const props = mapComboGameToItemProps(group);
    const homeSpread = props.spreadOdds.find((option) =>
      option.id.startsWith("spread-home"),
    );
    const awaySpread = props.spreadOdds.find((option) =>
      option.id.startsWith("spread-away"),
    );

    assert.equal(homeSpread?.spreadTeamCode, "ARG");
    assert.equal(homeSpread?.spreadLine, "-1.5");
    assert.equal(homeSpread?.label, "ARG -1.5");
    assert.equal(awaySpread?.spreadTeamCode, "AUT");
    assert.equal(awaySpread?.spreadLine, "+1.5");
    assert.equal(awaySpread?.label, "AUT +1.5");
  });

  it("keeps team-code spread slugs when present", () => {
    const props = mapComboGameToItemProps({
      slug: "fifwc-fra-irq-2026-06-22",
      title: "France vs Iraq",
      kickoffLabel: "2026-06-22",
      homeTeam: { name: "France", code: "FRA" },
      awayTeam: { name: "Iraq", code: "IRQ" },
      markets: [
        {
          id: "spread-fra",
          slug: "fifwc-fra-irq-2026-06-22-spread-fra-1pt5",
          title: "France -1.5",
          outcomes: ["Yes", "No"],
          outcomePrices: ["0.5", "0.5"],
        },
      ],
    });
    const spread = props.spreadOdds[0];

    assert.equal(spread?.spreadTeamCode, "FRA");
    assert.equal(spread?.label, "FRA -1.5");
  });
});

describe("isComboOddsOptionSelected", () => {
  it("supports multiple selected odds ids", () => {
    assert.equal(
      isComboOddsOptionSelected("home:yes", ["home:yes", "total:yes"], undefined),
      true,
    );
    assert.equal(
      isComboOddsOptionSelected("draw:yes", ["home:yes", "total:yes"], undefined),
      false,
    );
  });
});
