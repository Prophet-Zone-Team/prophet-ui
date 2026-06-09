import {
  curatedTeamKeyToId,
  findCuratedTeamByFuzzyLabel
} from "@/data/teams/curated-team-list";
import { resolveWorldCupTeamByGroupItemTitle } from "@/lib/market/resolve-winner-team";
import type { ProphetAnalyticsTeamPathContext } from "@/types/prophet-api";
import type {
  PathDifficulty,
  SimulatorSnapshot,
  SimulatorTeam
} from "@/views/analytics/simulator/simulator/types";

export type TeamPathContextEntry = {
  team: SimulatorTeam;
  snapshot: SimulatorSnapshot;
};

export type TeamPathContextData = {
  entries: TeamPathContextEntry[];
  snapshotsByTeamId: Record<string, SimulatorSnapshot>;
};

const EMPTY_SNAPSHOT: SimulatorSnapshot = {
  currentStage: "—",
  pathDifficulty: "Medium",
  biggestOpponent: "TBD"
};

function parsePathDifficulty(label: string | undefined): PathDifficulty {
  if (label === "Easy" || label === "Medium" || label === "Hard") {
    return label;
  }

  return "Medium";
}

function formatBiggestOpponent(
  name: string | undefined,
  round: string | undefined
): string {
  if (!name?.trim()) {
    return "TBD";
  }

  const trimmedName = name.trim();

  if (!round?.trim()) {
    return trimmedName;
  }

  return `${trimmedName} (${round.trim()})`;
}

function resolveSimulatorTeam(teamName: string): SimulatorTeam {
  const resolved =
    resolveWorldCupTeamByGroupItemTitle(teamName) ??
    findCuratedTeamByFuzzyLabel(teamName);

  if (resolved) {
    return {
      id: resolved.id,
      teamCode: resolved.code,
      teamName,
      logoUrl: resolved.logoUrl
    };
  }

  return {
    id: curatedTeamKeyToId(teamName),
    teamCode: teamName.slice(0, 3).toUpperCase(),
    teamName
  };
}

function mapItem(item: ProphetAnalyticsTeamPathContext): TeamPathContextEntry | null {
  const teamName = item.team_name?.trim();

  if (!teamName) {
    return null;
  }

  const team = resolveSimulatorTeam(teamName);
  const snapshot: SimulatorSnapshot = {
    currentStage: item.current_stage?.trim() || "—",
    pathDifficulty: parsePathDifficulty(item.path_difficulty_label),
    biggestOpponent: formatBiggestOpponent(
      item.biggest_opponent_name,
      item.biggest_opponent_round
    )
  };

  return { team, snapshot };
}

export function mapTeamPathContextResponse(
  items: ProphetAnalyticsTeamPathContext[] | undefined
): TeamPathContextData {
  const entries = (items ?? [])
    .map(mapItem)
    .filter((entry): entry is TeamPathContextEntry => entry !== null)
    .sort((left, right) =>
      left.team.teamName.localeCompare(right.team.teamName)
    );

  const snapshotsByTeamId: Record<string, SimulatorSnapshot> = {};

  for (const entry of entries) {
    snapshotsByTeamId[entry.team.id] = entry.snapshot;
  }

  return { entries, snapshotsByTeamId };
}

export function getTeamPathContextSnapshot(
  snapshotsByTeamId: Record<string, SimulatorSnapshot>,
  teamId: string
): SimulatorSnapshot {
  return snapshotsByTeamId[teamId] ?? EMPTY_SNAPSHOT;
}
