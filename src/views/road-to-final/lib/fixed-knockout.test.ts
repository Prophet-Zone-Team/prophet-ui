import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CONFIRMED_KNOCKOUT_WINNERS,
  FIXED_KNOCKOUT_MATCH_IDS,
  isFixedKnockoutMatch,
  mergeWithFixedKnockoutWinners,
} from "./fixed-knockout";

describe("fixed-knockout", () => {
  it("defines confirmed R32 winners for all 16 matches 73 through 88", () => {
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
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[86], "argentina");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[87], "colombia");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[88], "egypt");
  });

  it("defines confirmed R16 winners for matches 89 through 96", () => {
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[89], "france");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[90], "morocco");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[91], "norway");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[92], "england");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[93], "spain");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[94], "belgium");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[95], "argentina");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[96], "switzerland");
  });

  it("defines confirmed QF winners for matches 97 through 100", () => {
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[97], "france");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[98], "spain");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[99], "england");
    assert.equal(CONFIRMED_KNOCKOUT_WINNERS[100], "argentina");
    assert.equal(FIXED_KNOCKOUT_MATCH_IDS.size, 28);
  });

  it("identifies fixed match ids", () => {
    assert.equal(isFixedKnockoutMatch(98), true);
    assert.equal(isFixedKnockoutMatch(99), true);
    assert.equal(isFixedKnockoutMatch(100), true);
    assert.equal(isFixedKnockoutMatch(101), false);
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
      86: "cape-verde",
      87: "ghana",
      88: "australia",
      89: "paraguay",
      90: "canada",
      91: "brazil",
      92: "mexico",
      93: "portugal",
      94: "usa",
      95: "egypt",
      96: "colombia",
      97: "morocco",
      98: "belgium",
      99: "norway",
      100: "switzerland",
      101: "germany",
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
    assert.equal(merged[86], "argentina");
    assert.equal(merged[87], "colombia");
    assert.equal(merged[88], "egypt");
    assert.equal(merged[89], "france");
    assert.equal(merged[90], "morocco");
    assert.equal(merged[91], "norway");
    assert.equal(merged[92], "england");
    assert.equal(merged[93], "spain");
    assert.equal(merged[94], "belgium");
    assert.equal(merged[95], "argentina");
    assert.equal(merged[96], "switzerland");
    assert.equal(merged[97], "france");
    assert.equal(merged[98], "spain");
    assert.equal(merged[99], "england");
    assert.equal(merged[100], "argentina");
    assert.equal(merged[101], "germany");
  });
});
