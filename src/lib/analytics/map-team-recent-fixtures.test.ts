import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapTeamRecentFixtures } from "@/lib/analytics/map-team-recent-fixtures";
import type { ProphetTeamStatsFixture } from "@/types/prophet-api";

function buildFixture(
  overrides: Partial<ProphetTeamStatsFixture> &
    Pick<
      ProphetTeamStatsFixture,
      "home_team_name" | "away_team_name" | "fixture_timestamp"
    >
): ProphetTeamStatsFixture {
  return {
    id: overrides.id ?? 1,
    api_fixture_id: overrides.api_fixture_id ?? 100,
    fixture_date: overrides.fixture_date ?? "2026-01-15T00:00:00Z",
    fixture_timestamp: overrides.fixture_timestamp,
    home_goals: overrides.home_goals ?? 2,
    away_goals: overrides.away_goals ?? 1,
    home_team_name: overrides.home_team_name,
    away_team_name: overrides.away_team_name,
    league_name: overrides.league_name ?? "Friendly"
  };
}

describe("mapTeamRecentFixtures opponent resolution", () => {
  it("returns away team as opponent when focal team is home", () => {
    const rows = mapTeamRecentFixtures("Brazil", [
      buildFixture({
        id: 1,
        fixture_timestamp: 1_700_000_000,
        home_team_name: "Brazil",
        away_team_name: "Argentina"
      })
    ]);

    assert.equal(rows[0]?.opponent, "Argentina");
  });

  it("returns home team as opponent when focal team is away", () => {
    const rows = mapTeamRecentFixtures("Brazil", [
      buildFixture({
        id: 2,
        fixture_timestamp: 1_700_000_000,
        home_team_name: "Argentina",
        away_team_name: "Brazil"
      })
    ]);

    assert.equal(rows[0]?.opponent, "Argentina");
  });

  it("resolves opponent when API and UI team names differ", () => {
    const rows = mapTeamRecentFixtures("United States", [
      buildFixture({
        id: 3,
        fixture_timestamp: 1_700_000_000,
        home_team_name: "USA",
        away_team_name: "Mexico"
      })
    ]);

    assert.equal(rows[0]?.opponent, "Mexico");
  });

  it("resolves opponent when focal team uses API alias as away side", () => {
    const rows = mapTeamRecentFixtures("United States", [
      buildFixture({
        id: 4,
        fixture_timestamp: 1_700_000_000,
        home_team_name: "Mexico",
        away_team_name: "USA"
      })
    ]);

    assert.equal(rows[0]?.opponent, "Mexico");
  });

  it("returns empty opponent when team cannot be matched to either side", () => {
    const rows = mapTeamRecentFixtures("Brazil", [
      buildFixture({
        id: 5,
        fixture_timestamp: 1_700_000_000,
        home_team_name: "France",
        away_team_name: "Germany"
      })
    ]);

    assert.equal(rows[0]?.opponent, "");
  });
});
