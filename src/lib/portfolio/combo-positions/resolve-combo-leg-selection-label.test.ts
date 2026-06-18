import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ComboPositionLeg } from "@/lib/portfolio/combo-positions/types";

import { resolveComboLegSelectionLabel } from "./resolve-combo-leg-selection-label";

const colombiaLeg: ComboPositionLeg = {
  leg_index: 0,
  leg_outcome_label: "Yes",
  market: {
    slug: "fifwc-uzb-col-2026-06-17-col",
    title: "Colombia",
    outcome: "Yes",
    event: {
      event_title: "Uzbekistan vs. Colombia",
    },
  },
};

const czechiaLeg: ComboPositionLeg = {
  leg_index: 1,
  leg_outcome_label: "Yes",
  market: {
    slug: "fifwc-cze-rsa-2026-06-18-cze",
    title: "Czechia",
    outcome: "Yes",
    event: {
      event_title: "Czechia vs. South Africa",
    },
  },
};

describe("resolveComboLegSelectionLabel", () => {
  it("maps moneyline yes legs to team names from market.title", () => {
    assert.equal(resolveComboLegSelectionLabel(colombiaLeg), "Colombia");
    assert.equal(resolveComboLegSelectionLabel(czechiaLeg), "Czechia");
  });

  it("maps spread legs from market.title", () => {
    assert.equal(
      resolveComboLegSelectionLabel({
        leg_outcome_label: "Yes",
        market: {
          title: "Egypt +1.5",
          outcome: "Yes",
        },
      }),
      "Egypt +1.5",
    );
  });

  it("maps draw legs to Draw", () => {
    assert.equal(
      resolveComboLegSelectionLabel({
        leg_outcome_label: "Yes",
        market: {
          title: "Draw (Mexico vs. South Africa)",
          slug: "fifwc-mex-rsa-2026-06-18-draw",
          outcome: "Yes",
        },
      }),
      "Draw",
    );
  });

  it("maps total legs from market.title", () => {
    assert.equal(
      resolveComboLegSelectionLabel({
        leg_outcome_label: "Yes",
        market: {
          title: "Over 2.5",
          outcome: "Yes",
        },
      }),
      "Over 2.5",
    );
  });

  it("falls back to event title when market title is missing", () => {
    assert.equal(
      resolveComboLegSelectionLabel({
        leg_outcome_label: "Yes",
        market: {
          outcome: "Yes",
          event: {
            event_title: "Spain vs. Cabo Verde",
          },
        },
      }),
      "Spain vs. Cabo Verde",
    );
  });

  it("falls back to outcome then Outcome", () => {
    assert.equal(
      resolveComboLegSelectionLabel({
        leg_outcome_label: "Maybe",
        market: {},
      }),
      "Maybe",
    );

    assert.equal(resolveComboLegSelectionLabel({ market: {} }), "Outcome");
  });
});
