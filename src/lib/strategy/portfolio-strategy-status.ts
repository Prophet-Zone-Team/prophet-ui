import type { CuratedTeamEntry } from "@/data/teams/curated-team-list";
import { getTournamentWinner, hasTournamentWinner } from "@/data/strategy";
import type { ProphetStrategyTeamItem } from "@/types/prophet-api";
import { teamsMatchWinner } from "@/views/strategy/lib/map-strategy-data";

export type PortfolioStrategyStatusType =
  | "not_open"
  | "hit_succeed"
  | "not_finished"
  | "hit_missed";

export type StrategyTeamTournamentState = {
  started: boolean;
  eliminated: boolean;
};

export const PORTFOLIO_STRATEGY_STATUS_CONFIG: Record<
  PortfolioStrategyStatusType,
  { label: string; color: string }
> = {
  not_open: { label: "Not open yet", color: "#000000" },
  hit_succeed: { label: "Hit Succeed", color: "#65AF14" },
  not_finished: { label: "Not Finished", color: "#FF674B" },
  hit_missed: { label: "Hit Missed", color: "#FF674B" }
};

function hasTeamStarted(state: StrategyTeamTournamentState): boolean {
  return state.started;
}

function isTeamEliminated(state: StrategyTeamTournamentState): boolean {
  return state.eliminated;
}

function strategyIncludesWinner(
  teams: CuratedTeamEntry[],
  winner: CuratedTeamEntry
): boolean {
  return teams.some((team) => teamsMatchWinner(team, winner));
}

export function parseProphetStrategyTeamStatus(
  raw: string | undefined
): StrategyTeamTournamentState | null {
  const normalized = raw?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (
    normalized === "not_started" ||
    normalized === "not_open" ||
    normalized === "pending"
  ) {
    return { started: false, eliminated: false };
  }

  if (
    normalized === "eliminated" ||
    normalized === "out" ||
    normalized === "lost" ||
    normalized === "missed"
  ) {
    return { started: true, eliminated: true };
  }

  if (
    normalized === "started" ||
    normalized === "active" ||
    normalized === "playing" ||
    normalized === "live" ||
    normalized === "open"
  ) {
    return { started: true, eliminated: false };
  }

  if (
    normalized === "winner" ||
    normalized === "won" ||
    normalized === "champion"
  ) {
    return { started: true, eliminated: false };
  }

  return null;
}

/** Prefer API status; otherwise only curated elimination (not curated `started`). */
export function resolveStrategyTeamTournamentState(
  item: ProphetStrategyTeamItem,
  curated?: CuratedTeamEntry
): StrategyTeamTournamentState {
  const fromApi = parseProphetStrategyTeamStatus(item.status);

  if (fromApi) {
    return fromApi;
  }

  return {
    started: curated?.eliminated === true,
    eliminated: curated?.eliminated === true
  };
}

export function curatedEntryToTournamentState(
  entry: CuratedTeamEntry
): StrategyTeamTournamentState {
  return {
    started: entry.started === true || entry.eliminated === true,
    eliminated: entry.eliminated === true
  };
}

export function resolvePortfolioStrategyStatus(
  teamStates: StrategyTeamTournamentState[],
  strategyTeams: CuratedTeamEntry[] = []
): PortfolioStrategyStatusType {
  const winner = getTournamentWinner();

  if (
    hasTournamentWinner() &&
    winner &&
    strategyIncludesWinner(strategyTeams, winner)
  ) {
    return "hit_succeed";
  }

  if (teamStates.length > 0 && teamStates.every(isTeamEliminated)) {
    return "hit_missed";
  }

  if (teamStates.length > 0 && teamStates.every((state) => !hasTeamStarted(state))) {
    return "not_open";
  }

  return "not_finished";
}

export function getPortfolioStrategyStatusDisplay(
  teamStates: StrategyTeamTournamentState[],
  strategyTeams: CuratedTeamEntry[] = []
): { status: PortfolioStrategyStatusType; label: string; color: string } {
  const status = resolvePortfolioStrategyStatus(teamStates, strategyTeams);
  const { label, color } = PORTFOLIO_STRATEGY_STATUS_CONFIG[status];

  return { status, label, color };
}

/** Catalog/mock strategies use full curated `started` + `eliminated` flags. */
export function getPortfolioStrategyStatusDisplayFromCurated(
  teams: CuratedTeamEntry[]
): { status: PortfolioStrategyStatusType; label: string; color: string } {
  const teamStates = teams.map(curatedEntryToTournamentState);

  return getPortfolioStrategyStatusDisplay(teamStates, teams);
}
