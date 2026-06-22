import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyComboGameGroupPickUpdate,
  applyComboMarketPickUpdate,
} from "@/lib/combo/combo-group-picks";
import type { ComboGameGroup } from "@/types/combo";

const sampleGroup: ComboGameGroup = {
  slug: "fifwc-cze-rsa-2026-06-18",
  kickoffLabel: "2026-06-18",
  homeTeam: { code: "CZE", name: "Czechia" },
  awayTeam: { code: "RSA", name: "South Africa" },
  markets: [
    {
      id: "fifwc-cze-rsa-2026-06-18-cze",
      slug: "fifwc-cze-rsa-2026-06-18-cze",
      title: "Czechia",
      outcomes: ["Yes", "No"],
      image: "",
    },
    {
      id: "fifwc-cze-rsa-2026-06-18-total-2pt5",
      slug: "fifwc-cze-rsa-2026-06-18-total-2pt5",
      title: "Total 2.5",
      outcomes: ["Over", "Under"],
      image: "",
    },
    {
      id: "fifwc-cze-rsa-2026-06-18-total-3pt5",
      slug: "fifwc-cze-rsa-2026-06-18-total-3pt5",
      title: "Total 3.5",
      outcomes: ["Over", "Under"],
      image: "",
    },
    {
      id: "fifwc-cze-rsa-2026-06-18-total-5pt5",
      slug: "fifwc-cze-rsa-2026-06-18-total-5pt5",
      title: "Total 5.5",
      outcomes: ["Over", "Under"],
      image: "",
    },
  ],
};

describe("applyComboMarketPickUpdate", () => {
  it("keeps other market picks when adding a new market leg from the same game", () => {
    const moneylinePick = {
      id: "fifwc-cze-rsa-2026-06-18-cze",
      outcomeSide: "yes",
    };
    const totalPick = {
      id: "fifwc-cze-rsa-2026-06-18-total-2pt5",
      outcomeSide: "yes",
    };

    const nextPicks = applyComboMarketPickUpdate(
      [moneylinePick],
      totalPick.id,
      totalPick.outcomeSide,
      () => totalPick,
    );

    assert.deepEqual(nextPicks, [moneylinePick, totalPick]);
  });

  it("toggles off when selecting the same market outcome again", () => {
    const moneylinePick = {
      id: "fifwc-cze-rsa-2026-06-18-cze",
      outcomeSide: "yes",
    };

    const nextPicks = applyComboMarketPickUpdate(
      [moneylinePick],
      moneylinePick.id,
      moneylinePick.outcomeSide,
      () => moneylinePick,
    );

    assert.deepEqual(nextPicks, []);
  });

  it("replaces the same market pick when switching outcome side", () => {
    const overPick = {
      id: "fifwc-cze-rsa-2026-06-18-total-2pt5",
      outcomeSide: "yes",
    };
    const underPick = {
      id: "fifwc-cze-rsa-2026-06-18-total-2pt5",
      outcomeSide: "no",
    };

    const nextPicks = applyComboMarketPickUpdate(
      [overPick],
      underPick.id,
      underPick.outcomeSide,
      () => underPick,
    );

    assert.deepEqual(nextPicks, [underPick]);
  });

  it("replaces an existing over when selecting another over line", () => {
    const moneylinePick = {
      id: "fifwc-cze-rsa-2026-06-18-cze",
      outcomeSide: "yes",
    };
    const overTwoPick = {
      id: "fifwc-cze-rsa-2026-06-18-total-2pt5",
      outcomeSide: "yes",
    };
    const overThreePick = {
      id: "fifwc-cze-rsa-2026-06-18-total-3pt5",
      outcomeSide: "yes",
    };

    const nextPicks = applyComboGameGroupPickUpdate(
      [moneylinePick, overTwoPick],
      sampleGroup,
      overThreePick.id,
      overThreePick.outcomeSide,
      () => overThreePick,
    );

    assert.deepEqual(nextPicks, [moneylinePick, overThreePick]);
  });

  it("replaces an existing moneyline side when selecting another", () => {
    const homePick = {
      id: "fifwc-cze-rsa-2026-06-18-cze",
      outcomeSide: "yes",
    };
    const drawPick = {
      id: "fifwc-cze-rsa-2026-06-18-draw",
      outcomeSide: "yes",
    };

    const groupWithDraw: ComboGameGroup = {
      ...sampleGroup,
      markets: [
        ...sampleGroup.markets,
        {
          id: "fifwc-cze-rsa-2026-06-18-draw",
          slug: "fifwc-cze-rsa-2026-06-18-draw",
          title: "Draw",
          outcomes: ["Yes", "No"],
          image: "",
        },
      ],
    };

    const nextPicks = applyComboGameGroupPickUpdate(
      [homePick],
      groupWithDraw,
      drawPick.id,
      drawPick.outcomeSide,
      () => drawPick,
    );

    assert.deepEqual(nextPicks, [drawPick]);
  });

  it("keeps an existing over when adding a compatible under leg", () => {
    const overThreePick = {
      id: "fifwc-cze-rsa-2026-06-18-total-3pt5",
      outcomeSide: "yes",
    };
    const underFivePick = {
      id: "fifwc-cze-rsa-2026-06-18-total-5pt5",
      outcomeSide: "no",
    };

    const nextPicks = applyComboGameGroupPickUpdate(
      [overThreePick],
      sampleGroup,
      underFivePick.id,
      underFivePick.outcomeSide,
      () => underFivePick,
    );

    assert.deepEqual(nextPicks, [overThreePick, underFivePick]);
  });
});
