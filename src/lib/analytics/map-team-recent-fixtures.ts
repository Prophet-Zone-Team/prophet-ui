import { formatDateFromIso } from "@/lib/formatters/datetime";
import type { ProphetTeamStatsFixture } from "@/types/prophet-api";
import { formatMatchScore } from "@/views/trade/game/match-history/format";
import type {
  RecentFixtureResult,
  RecentFixtureRow
} from "@/views/trade/game/stats/recent-matches/types";

function resolveOpponentName(
  apiTeamId: number,
  fixture: ProphetTeamStatsFixture
): string {
  if (fixture.home_team_id === apiTeamId) {
    return fixture.away_team_name ?? "";
  }

  if (fixture.away_team_id === apiTeamId) {
    return fixture.home_team_name ?? "";
  }

  return "";
}

function resolveFixtureResult(
  apiTeamId: number,
  fixture: ProphetTeamStatsFixture
): RecentFixtureResult {
  const isHome = fixture.home_team_id === apiTeamId;
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
  apiTeamId: number,
  fixtures: ProphetTeamStatsFixture[] | null | undefined
): RecentFixtureRow[] {
  return (fixtures ?? [])
    .slice()
    .sort((a, b) => b.fixture_timestamp - a.fixture_timestamp)
    .slice(0, 5)
    .map((fixture) => ({
      id: String(fixture.id),
      date: formatDateFromIso(fixture.fixture_date),
      opponent: resolveOpponentName(apiTeamId, fixture),
      result: resolveFixtureResult(apiTeamId, fixture),
      score: formatMatchScore(fixture.home_goals, fixture.away_goals),
      competition: fixture.league_name?.trim() || "Match"
    }));
}

export function findTeamStatsByPolymarketTeamId<
  T extends { polymarket_team_id?: number }
>(teams: T[] | undefined, polymarketTeamId: number): T | undefined {
  return teams?.find((team) => team.polymarket_team_id === polymarketTeamId);
}

export function findTeamStatsByApiTeamId<T extends { api_team_id?: number }>(
  teams: T[] | undefined,
  apiTeamId: number
): T | undefined {
  return teams?.find((team) => team.api_team_id === apiTeamId);
}
