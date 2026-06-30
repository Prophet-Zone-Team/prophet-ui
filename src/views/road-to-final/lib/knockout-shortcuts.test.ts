import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FIXED_GROUP_PLACEMENTS, fixedThirdPlaceOption } from "./fixed-group-stage";
import { applyKnockoutShortcut } from "./knockout-shortcuts";

describe("knockout-shortcuts fixed results", () => {
  it("preserves confirmed R32 winners when filling the full bracket", () => {
    assert.ok(fixedThirdPlaceOption);

    const winners = applyKnockoutShortcut({
      placements: FIXED_GROUP_PLACEMENTS,
      thirdPlaceOption: fixedThirdPlaceOption,
      method: "random",
    });

    assert.equal(winners[74], "paraguay");
    assert.equal(winners[76], "brazil");
    assert.ok(winners[104], "full bracket fill should pick a champion");
  });

  it("fills non-fixed matches", () => {
    assert.ok(fixedThirdPlaceOption);

    const winners = applyKnockoutShortcut({
      placements: FIXED_GROUP_PLACEMENTS,
      thirdPlaceOption: fixedThirdPlaceOption,
      method: "fifa",
    });

    const filledNonFixedR32 = [73, 75, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88];

    for (const matchId of filledNonFixedR32) {
      assert.ok(
        winners[matchId],
        `Match ${matchId} should be filled by shortcut`
      );
    }
  });
});
