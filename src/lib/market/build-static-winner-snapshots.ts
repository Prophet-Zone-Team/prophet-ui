import curatedTeams from "@/data/teams/index";
import { isCuratedTeamVisible } from "@/data/teams/curated-team-list";
import { resolveWorldCupTeamByCuratedKey } from "@/lib/market/resolve-winner-team";
import type { TeamMarketSnapshot } from "@/types/market";

const PLACEHOLDER_UPDATED_AT = "1970-01-01T00:00:00.000Z";

export function buildStaticWinnerSnapshots(): TeamMarketSnapshot[] {
  const snapshotsByTeamId = new Map<string, TeamMarketSnapshot>();

  for (const indexKey of Object.keys(curatedTeams)) {
    const entry = curatedTeams[indexKey as keyof typeof curatedTeams];

    if (!isCuratedTeamVisible(entry)) {
      continue;
    }

    const team = resolveWorldCupTeamByCuratedKey(indexKey);

    if (!team || snapshotsByTeamId.has(team.id)) {
      continue;
    }

    snapshotsByTeamId.set(team.id, {
      team,
      market: {
        teamId: team.id,
        probability: 0,
        change24h: 0,
        change7d: 0,
        volume: 0,
        sentiment: "neutral",
        bookmakerImpliedProbability: 0,
        updatedAt: PLACEHOLDER_UPDATED_AT,
      },
    });
  }

  return [...snapshotsByTeamId.values()].sort((left, right) =>
    left.team.name.localeCompare(right.team.name),
  );
}
