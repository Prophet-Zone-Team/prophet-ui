import type { ProphetHeadToHeadFixture } from "@/types/prophet-api";
import type {
  MatchHistoryEntry,
  MatchHistoryResultKind
} from "@/views/trade/game/match-history/types";

import { resolveTeamCode, type TeamCodeLookup } from "./map-team-power-ranking";

function normalizeTeamName(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function isFocalHome(
  fixture: ProphetHeadToHeadFixture,
  focalTeamName: string
): boolean {
  const focal = normalizeTeamName(focalTeamName);
  const home = normalizeTeamName(fixture.home_team_name);

  if (home === focal) {
    return true;
  }

  const away = normalizeTeamName(fixture.away_team_name);
  return away !== focal;
}

function resolveResult(
  fixture: ProphetHeadToHeadFixture,
  focalTeamName: string
): { result: MatchHistoryResultKind; penaltyScore?: string } {
  const homeGoals = fixture.home_goals ?? 0;
  const awayGoals = fixture.away_goals ?? 0;
  const focalIsHome = isFocalHome(fixture, focalTeamName);
  const focalGoals = focalIsHome ? homeGoals : awayGoals;
  const opponentGoals = focalIsHome ? awayGoals : homeGoals;
  const status = (fixture.status_short ?? "").toUpperCase();

  if (focalGoals > opponentGoals) {
    return { result: "win" };
  }

  if (focalGoals < opponentGoals) {
    return { result: "lose" };
  }

  // Shootout winner is not available from the API; show a regular draw.
  if (status.includes("PEN")) {
    return { result: "draw" };
  }

  return { result: "draw" };
}

function formatFixtureLabel(fixture: ProphetHeadToHeadFixture): string {
  const league = fixture.league_name?.trim();
  const season = fixture.season;

  if (league && season !== undefined) {
    return `${league} ${season}`;
  }

  return league ?? "Fixture";
}

export function mapHeadToHeadFixtureToEntry(
  fixture: ProphetHeadToHeadFixture,
  focalTeamName: string,
  teamCodeLookup?: TeamCodeLookup
): MatchHistoryEntry {
  const homeName = fixture.home_team_name ?? "";
  const awayName = fixture.away_team_name ?? "";
  const { result, penaltyScore } = resolveResult(fixture, focalTeamName);

  return {
    id: `${fixture.fixture_date ?? "unknown"}-${homeName}-${awayName}`,
    playedAt: fixture.fixture_date ?? "",
    format: formatFixtureLabel(fixture),
    homeCode: resolveTeamCode(homeName, teamCodeLookup),
    awayCode: resolveTeamCode(awayName, teamCodeLookup),
    homeScore: fixture.home_goals ?? 0,
    awayScore: fixture.away_goals ?? 0,
    penaltyScore,
    result
  };
}

export function buildMatchHistoryEntries(
  fixtures: ProphetHeadToHeadFixture[] | undefined,
  teamCodeLookup?: TeamCodeLookup
): MatchHistoryEntry[] {
  const list = fixtures ?? [];

  return list
    .map((fixture) =>
      mapHeadToHeadFixtureToEntry(
        fixture,
        fixture.home_team_name ?? "",
        teamCodeLookup
      )
    )
    .sort((a, b) => b.playedAt.localeCompare(a.playedAt));
}
