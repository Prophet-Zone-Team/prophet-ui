import { resolveWorldCupTeamByGroupItemTitle } from "@/lib/market/resolve-winner-team";
import type { ProphetTeamGameResult } from "@/types/prophet-api";
import type { Team, WorldCupMatch } from "@/types/market";

function normalizeTeamName(value: string): string {
  return value.trim().toLowerCase();
}

function resolveStartTimeIso(startTime: number): string {
  const milliseconds = startTime > 1_000_000_000_000 ? startTime : startTime * 1000;
  return new Date(milliseconds).toISOString();
}

function resolveTeamId(
  teamName: string,
  currentTeamId: Team["id"],
  currentTeamName: string
): Team["id"] | undefined {
  const resolved = resolveWorldCupTeamByGroupItemTitle(teamName)?.id;

  if (resolved) {
    return resolved;
  }

  if (normalizeTeamName(teamName) === normalizeTeamName(currentTeamName)) {
    return currentTeamId;
  }

  return undefined;
}

export function mapTeamGameResultsToMatches(
  results: ProphetTeamGameResult[],
  currentTeamId: Team["id"],
  currentTeamName: string
): WorldCupMatch[] {
  return results.map((result) => {
    const kickoffAt = resolveStartTimeIso(result.start_time);
    const homeTeamId = resolveTeamId(
      result.home_team,
      currentTeamId,
      currentTeamName
    );
    const awayTeamId = resolveTeamId(
      result.away_team,
      currentTeamId,
      currentTeamName
    );

    return {
      id: `${result.home_team}-${result.away_team}-${result.start_time}`,
      stage: "EXTERNAL",
      homeTeamId,
      awayTeamId,
      homeDisplayName: result.home_team,
      awayDisplayName: result.away_team,
      homeScore: result.home_score,
      awayScore: result.away_score,
      status: "finished",
      kickoffAt,
      freshness: {
        source: "prophet-api",
        status: "live",
        lastUpdated: kickoffAt
      }
    };
  });
}
