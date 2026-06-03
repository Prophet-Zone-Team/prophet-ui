import type { CuratedTeamEntry } from "@/data/teams/curated-team-list";
import { getTournamentWinner, hasTournamentWinner } from "@/data/strategy";
import { teamsMatchWinner } from "@/views/strategy/lib/map-strategy-data";

export type PortfolioStrategyStatusType =
  | "not_open"
  | "hit_succeed"
  | "not_finished"
  | "hit_missed";

export const PORTFOLIO_STRATEGY_STATUS_CONFIG: Record<
  PortfolioStrategyStatusType,
  { label: string; color: string }
> = {
  not_open: { label: "Not open yet", color: "#000000" },
  hit_succeed: { label: "Hit Succeed", color: "#65AF14" },
  not_finished: { label: "Not Finished", color: "#FF674B" },
  hit_missed: { label: "Hit Missed", color: "#FF674B" }
};

function hasTeamStarted(team: CuratedTeamEntry): boolean {
  return team.started === true || team.eliminated === true;
}

function isTeamEliminated(team: CuratedTeamEntry): boolean {
  return team.eliminated === true;
}

function strategyIncludesWinner(
  teams: CuratedTeamEntry[],
  winner: CuratedTeamEntry
): boolean {
  return teams.some((team) => teamsMatchWinner(team, winner));
}

export function resolvePortfolioStrategyStatus(
  teams: CuratedTeamEntry[]
): PortfolioStrategyStatusType {
  const winner = getTournamentWinner();

  if (hasTournamentWinner() && winner && strategyIncludesWinner(teams, winner)) {
    return "hit_succeed";
  }

  if (teams.length > 0 && teams.every(isTeamEliminated)) {
    return "hit_missed";
  }

  if (teams.length > 0 && teams.every((team) => !hasTeamStarted(team))) {
    return "not_open";
  }

  return "not_finished";
}

export function getPortfolioStrategyStatusDisplay(
  teams: CuratedTeamEntry[]
): { status: PortfolioStrategyStatusType; label: string; color: string } {
  const status = resolvePortfolioStrategyStatus(teams);
  const { label, color } = PORTFOLIO_STRATEGY_STATUS_CONFIG[status];

  return { status, label, color };
}
