import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  exactScoreMatchesMoneylineSide,
  filterExactScoreOddsByMoneylineSide,
  resolveMoneylineSide,
} from "@/lib/combo/combo-leg-selection";

describe("combo leg selection", () => {
  it("resolves moneyline sides from pick codes", () => {
    assert.equal(resolveMoneylineSide("draw", "cze", "rsa"), "draw");
    assert.equal(resolveMoneylineSide("cze", "cze", "rsa"), "home");
    assert.equal(resolveMoneylineSide("rsa", "cze", "rsa"), "away");
  });

  it("filters exact scores by selected moneyline side", () => {
    const odds = [
      { id: "1:yes", label: "1-0", price: 0.1 },
      { id: "2:yes", label: "1-1", price: 0.12 },
      { id: "3:yes", label: "0-1", price: 0.08 },
      { id: "4:yes", label: "Any Other", price: 0.2 },
    ];

    assert.deepEqual(
      filterExactScoreOddsByMoneylineSide(odds, "home").map((entry) => entry.label),
      ["1-0", "Any Other"],
    );
    assert.deepEqual(
      filterExactScoreOddsByMoneylineSide(odds, "draw").map((entry) => entry.label),
      ["1-1", "Any Other"],
    );
    assert.deepEqual(
      filterExactScoreOddsByMoneylineSide(odds, "away").map((entry) => entry.label),
      ["0-1", "Any Other"],
    );
  });

  it("matches exact score labels to moneyline sides", () => {
    assert.equal(exactScoreMatchesMoneylineSide("2-1", "home"), true);
    assert.equal(exactScoreMatchesMoneylineSide("2-1", "draw"), false);
    assert.equal(exactScoreMatchesMoneylineSide("1-1", "draw"), true);
    assert.equal(exactScoreMatchesMoneylineSide("0-2", "away"), true);
    assert.equal(exactScoreMatchesMoneylineSide("Any Other", "away"), true);
  });
});
