import { formatMatchVersusTitle } from "@/lib/market/trade-widget-header";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import type { ProphetTeamsConditionTeam } from "@/types/prophet-api";
import type { UserPositionRecord } from "@/types/market";

export type OpenOrderMarketContext = {
  title: string;
  teams: ProphetTeamsConditionTeam[];
};

export function formatTeamsConditionTitle(
  teams: ProphetTeamsConditionTeam[]
): string {
  if (teams.length === 0) {
    return "";
  }

  if (teams.length === 1) {
    return teams[0]?.name ?? "";
  }

  const home =
    teams.find((team) => team.ordering === "home") ?? teams[0];
  const away =
    teams.find((team) => team.ordering === "away") ?? teams[1] ?? teams[0];

  return formatMatchVersusTitle(home.name, away.name);
}

export function collectUniqueConditionIds(orders: UserOpenOrder[]): string[] {
  const ids = new Set<string>();

  for (const order of orders) {
    const market = order.market?.trim();

    if (market) {
      ids.add(market);
    }
  }

  return [...ids];
}

export function collectUniqueConditionIdsFromPositions(
  positions: UserPositionRecord[]
): string[] {
  const ids = new Set<string>();

  for (const position of positions) {
    const conditionId = position.conditionId?.trim();

    if (conditionId) {
      ids.add(conditionId);
    }
  }

  return [...ids];
}

export function buildOpenOrderMarketMap(
  data: Record<string, ProphetTeamsConditionTeam[]>
): Record<string, OpenOrderMarketContext> {
  const map: Record<string, OpenOrderMarketContext> = {};

  for (const [conditionId, teams] of Object.entries(data)) {
    const safeTeams = Array.isArray(teams) ? teams : [];
    map[conditionId] = {
      title: formatTeamsConditionTitle(safeTeams),
      teams: safeTeams
    };
  }

  return map;
}

export function resolveMatchSidesFromTeams(
  teams: ProphetTeamsConditionTeam[]
): { home: ProphetTeamsConditionTeam; away: ProphetTeamsConditionTeam } | undefined {
  if (teams.length < 2) {
    return undefined;
  }

  const home = teams.find((team) => team.ordering === "home") ?? teams[0];
  const away =
    teams.find((team) => team.ordering === "away") ?? teams[1] ?? teams[0];

  if (!home || !away) {
    return undefined;
  }

  return { home, away };
}

export type PortfolioMarketIcon =
  | { kind: "single"; teamName: string }
  | { kind: "match"; homeName: string; awayName: string }
  | { kind: "draw" }
  | { kind: "placeholder" };

export function resolvePortfolioMarketIcon(
  teams: ProphetTeamsConditionTeam[],
  outcome: string
): PortfolioMarketIcon {
  const normalizedOutcome = outcome.trim().toLowerCase();

  if (teams.length === 0) {
    return { kind: "placeholder" };
  }

  if (teams.length === 1) {
    const team = resolveTeamForOutcome(teams, outcome);
    return { kind: "single", teamName: team?.name ?? teams[0]?.name ?? "" };
  }

  const sides = resolveMatchSidesFromTeams(teams);

  if (!sides) {
    return { kind: "placeholder" };
  }

  const matchedTeam = teams.find(
    (team) => team.name.trim().toLowerCase() === normalizedOutcome
  );

  if (matchedTeam) {
    return { kind: "single", teamName: matchedTeam.name };
  }

  if (normalizedOutcome === "draw") {
    return { kind: "draw" };
  }

  return {
    kind: "match",
    homeName: sides.home.name,
    awayName: sides.away.name
  };
}

export function resolveTeamForOutcome(
  teams: ProphetTeamsConditionTeam[],
  outcome: string
): ProphetTeamsConditionTeam | undefined {
  const normalizedOutcome = outcome.trim().toLowerCase();

  if (!normalizedOutcome) {
    return undefined;
  }

  const matched = teams.find(
    (team) => team.name.trim().toLowerCase() === normalizedOutcome
  );

  if (matched) {
    return matched;
  }

  if (teams.length === 1) {
    return teams[0];
  }

  return undefined;
}
