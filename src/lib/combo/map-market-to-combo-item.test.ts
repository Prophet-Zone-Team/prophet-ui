import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildComboSelectedOddsIdForPick,
  mapComboGameToItemProps,
  resolveComboPickSelectionLabel,
  resolveDefaultComboMatchTotalPreviewOdds,
  resolveSpreadMarketForTeamLine,
  resolveSpreadOptionsForTeam,
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

  it("resolves spread line options for one team", () => {
    const multiLineGroup: ComboGameGroup = {
      ...group,
      markets: [
        ...group.markets,
        {
          id: "spread-home-25",
          slug: "fifwc-arg-aut-2026-06-22-spread-home-2pt5",
          title: "Argentina -2.5",
          outcomes: ["Yes", "No"],
          outcomePrices: ["0.4", "0.6"],
        },
      ],
    };

    assert.deepEqual(resolveSpreadOptionsForTeam(multiLineGroup, "ARG"), [
      "-1.5",
      "-2.5",
    ]);
    assert.deepEqual(resolveSpreadOptionsForTeam(multiLineGroup, "AUT"), [
      "+1.5",
    ]);
    assert.equal(
      resolveSpreadMarketForTeamLine(multiLineGroup, "ARG", "-2.5")?.id,
      "spread-home-25",
    );
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

  it("treats an empty selectedOddsIds array as controlled with no selection", () => {
    assert.equal(
      isComboOddsOptionSelected("exact-score:yes", [], "exact-score:yes"),
      false,
    );
  });
});

describe("resolveComboPickSelectionLabel", () => {
  it("uses over/under labels for match totals", () => {
    const market = {
      id: "total-25",
      slug: "fifwc-arg-aut-2026-06-22-total-2pt5",
      title: "Argentina vs Austria: O/U 2.5",
      outcomes: ["Yes", "No"] as [string, string],
      outcomePrices: ["0.5", "0.5"] as [string, string],
      conditionId: "cond-total",
      positionIds: ["pos-over", "pos-under"] as [string, string],
    };

    assert.equal(resolveComboPickSelectionLabel(market, "yes"), "O 2.5");
    assert.equal(resolveComboPickSelectionLabel(market, "no"), "U 2.5");
  });

  it("uses home and away team names for moneyline toggle sides", () => {
    const market = {
      id: "fifwc-fra-irq-2026-06-22-fra",
      slug: "fifwc-fra-irq-2026-06-22-fra",
      title: "France vs Iraq",
      outcomes: ["France", "No"] as [string, string],
      outcomePrices: ["0.8", "0.2"] as [string, string],
      conditionId: "ml-home",
      positionIds: ["pos-home-yes", "pos-home-no"] as [string, string],
    };

    assert.equal(resolveComboPickSelectionLabel(market, "yes"), "France");
    assert.equal(resolveComboPickSelectionLabel(market, "no"), "Iraq");
  });

  it("uses team abbreviations and Draw for halftime markets", () => {
    const homeMarket = {
      id: "fifwc-fra-irq-2026-06-22-halftime-result-fra",
      slug: "fifwc-fra-irq-2026-06-22-halftime-result-fra",
      title: "HT France",
      outcomes: ["Yes", "No"] as [string, string],
      outcomePrices: ["0.5", "0.5"] as [string, string],
      conditionId: "cond-ht-home",
      positionIds: ["pos-ht-home-yes", "pos-ht-home-no"] as [string, string],
    };
    const drawMarket = {
      id: "fifwc-fra-irq-2026-06-22-halftime-result-draw",
      slug: "fifwc-fra-irq-2026-06-22-halftime-result-draw",
      title: "HT Draw",
      outcomes: ["Yes", "No"] as [string, string],
      outcomePrices: ["0.3", "0.7"] as [string, string],
      conditionId: "cond-ht-draw",
      positionIds: ["pos-ht-draw-yes", "pos-ht-draw-no"] as [string, string],
    };

    assert.equal(resolveComboPickSelectionLabel(homeMarket, "yes"), "France");
    assert.equal(resolveComboPickSelectionLabel(homeMarket, "no"), "Iraq");
    assert.equal(resolveComboPickSelectionLabel(drawMarket, "yes"), "Draw");
  });

  it("uses team names for spread markets", () => {
    const market = {
      id: "spread-home",
      slug: "fifwc-arg-aut-2026-06-22-spread-home-1pt5",
      title: "Argentina -1.5",
      outcomes: ["Yes", "No"] as [string, string],
      outcomePrices: ["0.5", "0.5"] as [string, string],
      conditionId: "cond-spread",
      positionIds: ["pos-spread-yes", "pos-spread-no"] as [string, string],
    };

    assert.equal(resolveComboPickSelectionLabel(market, "yes"), "Argentina");
  });
});

describe("buildComboSelectedOddsIdForPick", () => {
  it("highlights exact score outcome for both yes and no picks", () => {
    const market = {
      id: "fifwc-fra-irq-2026-06-22-exact-score-2-1",
      slug: "fifwc-fra-irq-2026-06-22-exact-score-2-1",
      title: "2-1",
      outcomes: ["Yes", "No"] as [string, string],
      outcomePrices: ["0.1", "0.9"] as [string, string],
      conditionId: "cond-exact",
      positionIds: ["pos-exact-yes", "pos-exact-no"] as [string, string],
    };

    assert.equal(
      buildComboSelectedOddsIdForPick(
        {
          id: market.id,
          type: "moneyline",
          outcomeSide: "yes",
        },
        market,
      ),
      `${market.id}:yes`,
    );
    assert.equal(
      buildComboSelectedOddsIdForPick(
        {
          id: market.id,
          type: "moneyline",
          outcomeSide: "no",
        },
        market,
      ),
      `${market.id}:yes`,
    );
  });
});

describe("mapComboGameToItemProps halftime labels", () => {
  it("maps halftime odds to team codes in home-draw-away order", () => {
    const group: ComboGameGroup = {
      slug: "fifwc-fra-irq-2026-06-22",
      title: "France vs Iraq",
      kickoffLabel: "2026-06-22",
      homeTeam: { name: "France", code: "FRA" },
      awayTeam: { name: "Iraq", code: "IRQ" },
      markets: [
        {
          id: "fifwc-fra-irq-2026-06-22-halftime-result-irq",
          slug: "fifwc-fra-irq-2026-06-22-halftime-result-irq",
          title: "HT Iraq",
          outcomes: ["Yes", "No"],
          outcomePrices: ["0.2", "0.8"],
        },
        {
          id: "fifwc-fra-irq-2026-06-22-halftime-result-draw",
          slug: "fifwc-fra-irq-2026-06-22-halftime-result-draw",
          title: "HT Draw",
          outcomes: ["Yes", "No"],
          outcomePrices: ["0.3", "0.7"],
        },
        {
          id: "fifwc-fra-irq-2026-06-22-halftime-result-fra",
          slug: "fifwc-fra-irq-2026-06-22-halftime-result-fra",
          title: "HT France",
          outcomes: ["Yes", "No"],
          outcomePrices: ["0.5", "0.5"],
        },
      ],
    };

    const props = mapComboGameToItemProps(group);

    assert.deepEqual(
      props.halftimeOdds?.map((option) => option.label),
      ["FRA", "Draw", "IRQ"],
    );
  });
});
