import { formatMatchVersusTitle } from "@/lib/market/trade-widget-header";
import {
  findSnapshotForConditionId,
  findSnapshotForTokenId
} from "@/lib/portfolio/portfolio-metrics";
import type { UserOpenOrder } from "@/lib/portfolio/types";
import type { ProphetTeamsConditionTeam } from "@/types/prophet-api";
import type { TeamMarketSnapshot } from "@/types/market";

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

function findSnapshotForTeamName(
  teamName: string,
  snapshots: TeamMarketSnapshot[]
): TeamMarketSnapshot | undefined {
  const normalized = teamName.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return snapshots.find((snapshot) => {
    const names = [
      snapshot.team.id,
      snapshot.team.name,
      snapshot.team.code,
      ...(snapshot.team.aliases ?? [])
    ]
      .filter(Boolean)
      .map((value) => value.toLowerCase());

    return names.some(
      (name) => name === normalized || normalized.includes(name) || name.includes(normalized)
    );
  });
}

export function findSnapshotForOpenOrder(input: {
  order: UserOpenOrder;
  teams: ProphetTeamsConditionTeam[];
  snapshots: TeamMarketSnapshot[];
}): TeamMarketSnapshot | undefined {
  const { order, teams, snapshots } = input;

  const byToken = findSnapshotForTokenId(order.asset_id, snapshots);
  if (byToken) {
    return byToken;
  }

  const byCondition = findSnapshotForConditionId(order.market, snapshots);
  if (byCondition) {
    return byCondition;
  }

  const outcome = order.outcome?.trim();
  if (outcome) {
    const matchedTeam = teams.find(
      (team) => team.name.trim().toLowerCase() === outcome.toLowerCase()
    );

    if (matchedTeam) {
      const byTeam = findSnapshotForTeamName(matchedTeam.name, snapshots);
      if (byTeam) {
        return byTeam;
      }
    }

    const byOutcome = findSnapshotForTeamName(outcome, snapshots);
    if (byOutcome) {
      return byOutcome;
    }
  }

  if (teams.length === 1) {
    return findSnapshotForTeamName(teams[0].name, snapshots);
  }

  const homeTeam = teams.find((team) => team.ordering === "home") ?? teams[0];
  if (homeTeam) {
    return findSnapshotForTeamName(homeTeam.name, snapshots);
  }

  return undefined;
}
