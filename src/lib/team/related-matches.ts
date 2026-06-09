import type { WorldCupMatch, WorldCupMatchStatus } from "@/types/market";

const STATUS_ORDER: Record<WorldCupMatchStatus, number> = {
  live: 0,
  scheduled: 1,
  finished: 2,
  postponed: 3,
  cancelled: 4,
  unknown: 5
};

export function getRelatedMatchesForTeam(
  teamId: string,
  matches: WorldCupMatch[]
): WorldCupMatch[] {
  return matches
    .filter(
      (match) => match.homeTeamId === teamId || match.awayTeamId === teamId
    )
    .sort((left, right) => {
      const statusDiff =
        (STATUS_ORDER[left.status] ?? 99) - (STATUS_ORDER[right.status] ?? 99);

      if (statusDiff !== 0) {
        return statusDiff;
      }

      const leftTime = left.kickoffAt ? Date.parse(left.kickoffAt) : 0;
      const rightTime = right.kickoffAt ? Date.parse(right.kickoffAt) : 0;

      if (left.status === "finished") {
        return rightTime - leftTime;
      }

      return leftTime - rightTime;
    });
}
