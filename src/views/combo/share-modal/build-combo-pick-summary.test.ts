import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PortfolioComboPositionPick } from "@/lib/portfolio/combo-positions/types";

import { buildComboPicksSummary } from "./build-combo-pick-summary";

describe("buildComboPicksSummary", () => {
  it("joins corrected selection labels with to win suffix", () => {
    const picks: PortfolioComboPositionPick[] = [
      {
        id: "1",
        matchupLabel: "Spain vs. Cabo Verde",
        selectionLabel: "Spain",
        marketTitle: "Spain",
        team: { name: "Spain", code: "Spain" },
      },
      {
        id: "2",
        matchupLabel: "Belgium vs. Egypt",
        selectionLabel: "Egypt +1.5",
        marketTitle: "Egypt +1.5",
        team: { name: "Egypt +1.5", code: "Egypt +1.5" },
      },
    ];

    assert.equal(
      buildComboPicksSummary(picks),
      "Spain to win, Egypt +1.5 to win",
    );
  });

  it("uses Outcome to win when selection label is empty", () => {
    assert.equal(
      buildComboPicksSummary([
        {
          id: "1",
          matchupLabel: "Match",
          selectionLabel: "   ",
          marketTitle: "",
          team: { name: "", code: "" },
        },
      ]),
      "Outcome to win",
    );
  });
});
