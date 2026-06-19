import {
  findCuratedTeamByFuzzyLabel,
  findCuratedTeamById,
  findCuratedTeamByName,
} from "@/data/teams/curated-team-list";
import { mapProphetGamesToMatches } from "@/lib/market/prophet-game-mapper";
import type {
  ProphetGroupDetailStanding,
  ProphetPolyMarketGameItem,
} from "@/types/prophet-api";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";

function resolveSnapshotTeamId(
  teamName: string,
  snapshots: TeamMarketSnapshot[],
): string | undefined {
  const curated =
    findCuratedTeamByName(teamName) ?? findCuratedTeamByFuzzyLabel(teamName);

  if (curated) {
    const snapshot = snapshots.find(
      (entry) =>
        entry.team.id === curated.id ||
        entry.team.code === curated.code ||
        entry.team.name === curated.name,
    );

    if (snapshot) {
      return snapshot.team.id;
    }

    return curated.id;
  }

  const byName = snapshots.find(
    (entry) =>
      entry.team.name.toLowerCase() === teamName.toLowerCase() ||
      findCuratedTeamById(entry.team.id)?.name.toLowerCase() ===
        teamName.toLowerCase(),
  );

  return byName?.team.id;
}

export function buildStandingsPointsBySnapshotTeamId(
  standings: ProphetGroupDetailStanding[],
  snapshots: TeamMarketSnapshot[],
): Map<string, number> {
  const pointsByTeamId = new Map<string, number>();

  for (const standing of standings) {
    const teamId = resolveSnapshotTeamId(standing.team_name, snapshots);

    if (teamId) {
      pointsByTeamId.set(teamId, standing.points);
    }
  }

  return pointsByTeamId;
}

export function mapGroupGameMatches(
  matches: ProphetPolyMarketGameItem[],
): WorldCupMatch[] {
  const mapped = mapProphetGamesToMatches(matches);

  return [...mapped].sort((left, right) => {
    const leftTime = left.kickoffAt
      ? new Date(left.kickoffAt).getTime()
      : Number.POSITIVE_INFINITY;
    const rightTime = right.kickoffAt
      ? new Date(right.kickoffAt).getTime()
      : Number.POSITIVE_INFINITY;

    return leftTime - rightTime;
  });
}
