import { formatDateFromIso } from "@/lib/formatters/datetime";
import { resolveTeamSide } from "@/lib/market/map-game-statistics";
import type { ProphetTeamStatsFixture } from "@/types/prophet-api";
import { formatMatchScore } from "@/views/trade/game/match-history/format";
import type {
  RecentFixtureResult,
  RecentFixtureRow
} from "@/views/trade/game/stats/recent-matches/types";

function normalizeTeamName(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function resolveOpponentName(
  teamName: string,
  fixture: ProphetTeamStatsFixture
): string {
  const homeName = fixture.home_team_name ?? "";
  const awayName = fixture.away_team_name ?? "";
  const side = resolveTeamSide(teamName, homeName, awayName);

  if (side === "home") {
    return awayName;
  }

  if (side === "away") {
    return homeName;
  }

  return "";
}

function resolveFixtureResult(
  teamName: string,
  fixture: ProphetTeamStatsFixture
): RecentFixtureResult {
  const isHome =
    normalizeTeamName(fixture.home_team_name) === normalizeTeamName(teamName);
  const goalsFor = isHome ? fixture.home_goals : fixture.away_goals;
  const goalsAgainst = isHome ? fixture.away_goals : fixture.home_goals;

  if (goalsFor > goalsAgainst) {
    return "win";
  }

  if (goalsFor < goalsAgainst) {
    return "lose";
  }

  return "draw";
}

export function mapTeamRecentFixtures(
  teamName: string,
  fixtures: ProphetTeamStatsFixture[] | null | undefined
): RecentFixtureRow[] {
  return (fixtures ?? [])
    .slice()
    .sort((a, b) => b.fixture_timestamp - a.fixture_timestamp)
    .slice(0, 5)
    .map((fixture) => ({
      id: String(fixture.id),
      date: formatDateFromIso(fixture.fixture_date),
      opponent: resolveOpponentName(teamName, fixture),
      result: resolveFixtureResult(teamName, fixture),
      score: formatMatchScore(fixture.home_goals, fixture.away_goals),
      competition: fixture.league_name?.trim() || "Match"
    }));
}

export function findTeamStatsByName<T extends { name: string }>(
  teams: T[] | undefined,
  teamName: string
): T | undefined {
  const normalized = normalizeTeamName(teamName);

  return teams?.find((team) => normalizeTeamName(team.name) === normalized);
}
