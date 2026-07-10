import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FIXED_GROUP_PLACEMENTS, fixedThirdPlaceOption } from "./fixed-group-stage";
import { applyKnockoutShortcut } from "./knockout-shortcuts";

describe("knockout-shortcuts fixed results", () => {
  it("preserves confirmed R32 and R16 winners when filling the full bracket", () => {
    assert.ok(fixedThirdPlaceOption);

    const winners = applyKnockoutShortcut({
      placements: FIXED_GROUP_PLACEMENTS,
      thirdPlaceOption: fixedThirdPlaceOption,
      method: "random",
    });

    assert.equal(winners[73], "canada");
    assert.equal(winners[74], "paraguay");
    assert.equal(winners[75], "morocco");
    assert.equal(winners[76], "brazil");
    assert.equal(winners[77], "france");
    assert.equal(winners[78], "norway");
    assert.equal(winners[79], "mexico");
    assert.equal(winners[80], "england");
    assert.equal(winners[81], "usa");
    assert.equal(winners[82], "belgium");
    assert.equal(winners[83], "portugal");
    assert.equal(winners[84], "spain");
    assert.equal(winners[85], "switzerland");
    assert.equal(winners[86], "argentina");
    assert.equal(winners[87], "colombia");
    assert.equal(winners[88], "egypt");
    assert.equal(winners[89], "france");
    assert.equal(winners[90], "morocco");
    assert.equal(winners[91], "norway");
    assert.equal(winners[92], "england");
    assert.equal(winners[93], "spain");
    assert.equal(winners[94], "belgium");
    assert.equal(winners[95], "argentina");
    assert.equal(winners[96], "switzerland");
    assert.equal(winners[97], "france");
    assert.ok(winners[104], "full bracket fill should pick a champion");
  });

  it("fills non-fixed matches", () => {
    assert.ok(fixedThirdPlaceOption);

    const winners = applyKnockoutShortcut({
      placements: FIXED_GROUP_PLACEMENTS,
      thirdPlaceOption: fixedThirdPlaceOption,
      method: "fifa",
    });

    const filledNonFixedQF = [98, 99, 100];

    for (const matchId of filledNonFixedQF) {
      assert.ok(
        winners[matchId],
        `Match ${matchId} should be filled by shortcut`
      );
    }
  });
});
