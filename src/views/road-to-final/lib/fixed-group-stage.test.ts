import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveThirdPlaceOption } from "@/lib/world-cup-path/calculate-path";

import { MATCH_LOOKUP } from "./bracket-config";
import { getMatchCandidateTeams } from "./bracket-resolver";
import {
  FIXED_GROUP_PLACEMENTS,
  FIXED_THIRD_PLACE_GROUPS,
  fixedThirdPlaceOption
} from "./fixed-group-stage";
import { isStepOneComplete } from "./validation";

const EXPECTED_R32_MATCHUPS: Record<number, [string, string]> = {
  73: ["south-africa", "canada"],
  74: ["germany", "paraguay"],
  75: ["netherlands", "morocco"],
  76: ["brazil", "japan"],
  77: ["france", "sweden"],
  78: ["ivory-coast", "norway"],
  79: ["mexico", "ecuador"],
  80: ["england", "congo-dr"],
  81: ["usa", "bosnia-herzegovina"],
  82: ["belgium", "senegal"],
  83: ["portugal", "croatia"],
  84: ["spain", "austria"],
  85: ["switzerland", "algeria"],
  86: ["argentina", "cape-verde"],
  87: ["colombia", "ghana"],
  88: ["australia", "egypt"]
};

describe("fixed-group-stage", () => {
  it("resolves third-place groups to Annexe C option 67", () => {
    const option = resolveThirdPlaceOption(FIXED_THIRD_PLACE_GROUPS);

    assert.equal(option?.option, 67);
    assert.ok(fixedThirdPlaceOption);
    assert.equal(fixedThirdPlaceOption.option, 67);
  });

  it("marks step one as complete for confirmed placements", () => {
    assert.equal(
      isStepOneComplete(FIXED_GROUP_PLACEMENTS, FIXED_THIRD_PLACE_GROUPS),
      true
    );
  });

  it("resolves all 16 Round of 32 matchups to confirmed teams", () => {
    for (const [matchIdRaw, [homeId, awayId]] of Object.entries(
      EXPECTED_R32_MATCHUPS
    )) {
      const matchId = Number(matchIdRaw);
      const match = MATCH_LOOKUP.get(matchId);

      assert.ok(match, `Missing match config for match ${matchId}`);

      const teams = getMatchCandidateTeams(
        match,
        FIXED_GROUP_PLACEMENTS,
        fixedThirdPlaceOption,
        {}
      );

      assert.equal(
        teams.length,
        2,
        `Match ${matchId} should resolve exactly two teams, got ${teams.map((team) => team.id).join(", ")}`
      );
      assert.equal(teams[0]?.id, homeId, `Match ${matchId} home team mismatch`);
      assert.equal(teams[1]?.id, awayId, `Match ${matchId} away team mismatch`);
    }
  });
});
