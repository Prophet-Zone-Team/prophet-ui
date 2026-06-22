import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveDefaultComboMatchTotalPreviewOdds,
} from "@/lib/combo/map-market-to-combo-item";
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
