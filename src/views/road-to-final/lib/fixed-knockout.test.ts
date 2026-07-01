import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CONFIRMED_KNOCKOUT_WINNERS,
  FIXED_KNOCKOUT_MATCH_IDS,
  isFixedKnockoutMatch,
  mergeWithFixedKnockoutWinners,
} from "./fixed-knockout";

describe("fixed-knockout", () => {
  it("defines confirmed R32 winners for matches 73 through 78", () => {
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[73], "canada");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[74], "paraguay");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[75], "morocco");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[76], "brazil");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[77], "france");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[78], "norway");
    assert.equal(FIXED_KNOCKOUT_MATCH_IDS.size, 6);
  });

  it("identifies fixed match ids", () => {
    assert.equal(isFixedKnockoutMatch(73), true);
    assert.equal(isFixedKnockoutMatch(77), true);
    assert.equal(isFixedKnockoutMatch(78), true);
    assert.equal(isFixedKnockoutMatch(79), false);
    assert.equal(isFixedKnockoutMatch(89), false);
  });

  it("merges fixed winners over conflicting user picks", () => {
    const merged = mergeWithFixedKnockoutWinners({
      73: "south-africa",
      74: "germany",
      75: "netherlands",
      76: "japan",
      77: "sweden",
      78: "ivory-coast",
      89: "france",
    });

    assert.equal(merged[73], "canada");
    assert.equal(merged[74], "paraguay");
    assert.equal(merged[75], "morocco");
    assert.equal(merged[76], "brazil");
    assert.equal(merged[77], "france");
    assert.equal(merged[78], "norway");
    assert.equal(merged[89], "france");
  });
});
