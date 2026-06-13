import assert from "node:assert/strict";
import { describe, it } from "node:test";

import curatedTeams from "@/data/teams/index";
import { isCuratedTeamDisplayed } from "@/data/teams/curated-team-list";
import { buildStaticWinnerSnapshots } from "@/lib/market/build-static-winner-snapshots";
import {
  resolveWorldCupTeamByCuratedKey,
  resolveWorldCupTeamByGroupItemTitle,
} from "@/lib/market/resolve-winner-team";

describe("resolve-winner-team", () => {
  it("maps curated index keys to world cup team ids", () => {
    assert.equal(resolveWorldCupTeamByCuratedKey("USA")?.id, "usa");
    assert.equal(resolveWorldCupTeamByCuratedKey("USA")?.code, "USA");
    assert.equal(resolveWorldCupTeamByCuratedKey("Curaçao")?.id, "curacao");
    assert.equal(resolveWorldCupTeamByCuratedKey("Ivory Coast")?.id, "ivory-coast");
    assert.equal(resolveWorldCupTeamByCuratedKey("South Korea")?.id, "south-korea");
    assert.equal(resolveWorldCupTeamByCuratedKey("south-korea")?.id, "south-korea");
    assert.equal(resolveWorldCupTeamByCuratedKey("Austria")?.id, "austria");
    assert.equal(resolveWorldCupTeamByCuratedKey("Algeria")?.id, "algeria");
    assert.notEqual(resolveWorldCupTeamByCuratedKey("Austria")?.id, "australia");
    assert.notEqual(resolveWorldCupTeamByCuratedKey("Algeria")?.id, "germany");
    assert.equal(resolveWorldCupTeamByCuratedKey("Paris Saint-Germain FC")?.id, "paris-saint-germain-fc");
  });

  it("maps polymarket group titles to world cup team ids", () => {
    assert.equal(resolveWorldCupTeamByGroupItemTitle("United States")?.id, "usa");
    assert.equal(resolveWorldCupTeamByGroupItemTitle("Spain")?.id, "spain");
    assert.equal(resolveWorldCupTeamByGroupItemTitle("Congo DR")?.id, "congo-dr");
  });

  it("builds a static snapshot for every visible curated team", () => {
    const snapshots = buildStaticWinnerSnapshots();
    const expectedCount = Object.values(curatedTeams).filter(isCuratedTeamDisplayed).length;

    assert.equal(snapshots.length, expectedCount);
    assert.ok(snapshots.every((snapshot) => snapshot.team.id.length > 0));
    assert.ok(snapshots.every((snapshot) => snapshot.team.code.length === 3));
    assert.equal(new Set(snapshots.map((snapshot) => snapshot.team.id)).size, expectedCount);
  });
});
