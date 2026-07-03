import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CONFIRMED_KNOCKOUT_WINNERS,
  FIXED_KNOCKOUT_MATCH_IDS,
  isFixedKnockoutMatch,
  mergeWithFixedKnockoutWinners,
} from "./fixed-knockout";

describe("fixed-knockout", () => {
  it("defines confirmed R32 winners for matches 73 through 85", () => {
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[73], "canada");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[74], "paraguay");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[75], "morocco");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[76], "brazil");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[77], "france");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[78], "norway");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[79], "mexico");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[80], "england");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[81], "usa");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[82], "belgium");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[83], "portugal");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[84], "spain");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[85], "switzerland");
    assert.equal(FIXED_KNOCKOUT_MATCH_IDS.size, 13);
  });

  it("identifies fixed match ids", () => {
    assert.equal(isFixedKnockoutMatch(73), true);
    assert.equal(isFixedKnockoutMatch(77), true);
    assert.equal(isFixedKnockoutMatch(78), true);
    assert.equal(isFixedKnockoutMatch(79), true);
    assert.equal(isFixedKnockoutMatch(80), true);
    assert.equal(isFixedKnockoutMatch(81), true);
    assert.equal(isFixedKnockoutMatch(82), true);
    assert.equal(isFixedKnockoutMatch(83), true);
    assert.equal(isFixedKnockoutMatch(84), true);
    assert.equal(isFixedKnockoutMatch(85), true);
    assert.equal(isFixedKnockoutMatch(86), false);
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
      79: "ecuador",
      80: "congo-dr",
      81: "bosnia-herzegovina",
      82: "senegal",
      83: "croatia",
      84: "austria",
      85: "algeria",
      89: "france",
    });

    assert.equal(merged[73], "canada");
    assert.equal(merged[74], "paraguay");
    assert.equal(merged[75], "morocco");
    assert.equal(merged[76], "brazil");
    assert.equal(merged[77], "france");
    assert.equal(merged[78], "norway");
    assert.equal(merged[79], "mexico");
    assert.equal(merged[80], "england");
    assert.equal(merged[81], "usa");
    assert.equal(merged[82], "belgium");
    assert.equal(merged[83], "portugal");
    assert.equal(merged[84], "spain");
    assert.equal(merged[85], "switzerland");
    assert.equal(merged[89], "france");
  });
});
