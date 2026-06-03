import { formatProbability } from "@/components/home/market-formatters";
import type { CuratedTeamEntry } from "@/data/teams/curated-team-list";
import {
  curatedAbbreviationToCode,
  findCuratedTeamByName
} from "@/data/teams/curated-team-list";
import { STRATEGY_DATA, type StrategyDataEntry } from "@/data/strategy";
import {
  calculateEstimatedRoiLabel,
  calculateHitReturnLabel,
  computeStrategyAllocation,
  formatLegProfitLabel,
  formatLegStakeLabel,
  formatStrategyBudget,
  type StrategyAllocation,
  type StrategyMetricsInput
} from "@/lib/strategy/strategy-metrics";
import type { TeamMarketSnapshot } from "@/types/market";

import type { StrategyCardTeamRef } from "../components/card/team-flags-stack";
import type {
  StrategyCardLegRow,
  StrategyCardVariant,
  StrategyTagBadgeVariant
} from "../components/card/types";

const LOW_RISK_STRATEGY_ID = "low-risk";

function buildSnapshotByTeamId(
  snapshots: TeamMarketSnapshot[]
): Map<string, TeamMarketSnapshot> {
  return new Map(snapshots.map((snapshot) => [snapshot.team.id, snapshot]));
}

function resolveTeamProbability(
  team: CuratedTeamEntry,
  snapshotByTeamId: Map<string, TeamMarketSnapshot>
): number | undefined {
  const curatedTeam = findCuratedTeamByName(team.name);

  if (!curatedTeam) {
    return undefined;
  }

  return snapshotByTeamId.get(curatedTeam.id)?.market.probability;
}

export function mapStrategyTeamsToRefs(
  strategyTeams: CuratedTeamEntry[]
): StrategyCardTeamRef[] {
  return strategyTeams.map((team) => ({
    code: curatedAbbreviationToCode(team.abbreviation),
    name: team.name,
    logoUrl: team.logo
  }));
}

export function mapCuratedTeamToRef(team: CuratedTeamEntry): StrategyCardTeamRef {
  return {
    code: curatedAbbreviationToCode(team.abbreviation),
    name: team.name,
    logoUrl: team.logo
  };
}

export function teamsMatchWinner(
  team: CuratedTeamEntry,
  winner: CuratedTeamEntry
): boolean {
  return (
    team.name === winner.name || team.abbreviation === winner.abbreviation
  );
}

function strategyIncludesWinner(
  strategyTeams: CuratedTeamEntry[],
  winner: CuratedTeamEntry
): boolean {
  return strategyTeams.some((team) => teamsMatchWinner(team, winner));
}

function markTournamentWinnerLegs(
  legs: StrategyCardLegRow[],
  strategyTeams: CuratedTeamEntry[],
  tournamentWinner: CuratedTeamEntry
): StrategyCardLegRow[] {
  return legs.map((leg, index) => {
    const team = strategyTeams[index];
    return {
      ...leg,
      isTournamentWinner: team
        ? teamsMatchWinner(team, tournamentWinner)
        : false
    };
  });
}

export function mapStrategyTeamsToLegs(
  strategyTeams: CuratedTeamEntry[],
  snapshotByTeamId: Map<string, TeamMarketSnapshot>,
  allocation: StrategyAllocation | undefined
): StrategyCardLegRow[] {
  return strategyTeams.map((team, index) => {
    const probability = resolveTeamProbability(team, snapshotByTeamId);
    const hasTeamProbability = probability !== undefined && probability > 0;

    return {
      id: team.abbreviation,
      team: {
        code: curatedAbbreviationToCode(team.abbreviation),
        name: team.name,
        logoUrl: team.logo
      },
      teamName: team.name,
      marketLabel: `Will ${team.name} win the 2026 FIFA World Cup?`,
      side: "yes",
      valueLabel: formatLegStakeLabel(allocation, index),
      probabilityLabel:
        probability !== undefined ? formatProbability(probability) : "—",
      hitReturnLabel: formatLegProfitLabel(allocation, hasTeamProbability)
    };
  });
}

export function buildStrategyMetricsInput(
  entry: StrategyDataEntry,
  snapshots: TeamMarketSnapshot[]
): StrategyMetricsInput {
  const snapshotByTeamId = buildSnapshotByTeamId(snapshots);
  return {
    budget: entry.budget,
    teams: entry.teams,
    probabilities: entry.teams.map((team) =>
      resolveTeamProbability(team, snapshotByTeamId)
    )
  };
}

export type AvailableStrategyCardData = StrategyDataEntry & {
  id: string;
  teamRefs: StrategyCardTeamRef[];
  legs: StrategyCardLegRow[];
  budgetLabel: string;
  estimatedRoiLabel: string;
  hitReturnLabel: string;
  badge?: StrategyTagBadgeVariant;
};

type StrategyCardBuildResult = AvailableStrategyCardData & {
  netRoi?: number;
};

function resolveStrategyBadges(
  cards: StrategyCardBuildResult[]
): Map<string, StrategyTagBadgeVariant> {
  const badges = new Map<string, StrategyTagBadgeVariant>();

  let highestRoiStrategyId: string | undefined;
  let highestRoi = Number.NEGATIVE_INFINITY;

  for (const card of cards) {
    if (card.netRoi !== undefined && card.netRoi > highestRoi) {
      highestRoi = card.netRoi;
      highestRoiStrategyId = card.id;
    }
  }

  for (const card of cards) {
    if (card.id === LOW_RISK_STRATEGY_ID) {
      badges.set(card.id, "low_risk");
      continue;
    }

    if (card.id === highestRoiStrategyId && card.netRoi !== undefined) {
      badges.set(card.id, "high_return");
    }
  }

  return badges;
}

export function buildAvailableStrategyCards(
  snapshots: TeamMarketSnapshot[]
): AvailableStrategyCardData[] {
  const snapshotByTeamId = buildSnapshotByTeamId(snapshots);

  const cards = Object.entries(STRATEGY_DATA).map(([id, entry]) => {
    const metricsInput = buildStrategyMetricsInput(entry, snapshots);
    const allocation = computeStrategyAllocation(metricsInput);

    return {
      id,
      ...entry,
      teamRefs: mapStrategyTeamsToRefs(entry.teams),
      legs: mapStrategyTeamsToLegs(entry.teams, snapshotByTeamId, allocation),
      budgetLabel: formatStrategyBudget(entry.budget),
      estimatedRoiLabel: calculateEstimatedRoiLabel(metricsInput),
      hitReturnLabel: calculateHitReturnLabel(metricsInput),
      netRoi: allocation?.netRoi
    };
  });

  const badges = resolveStrategyBadges(cards);

  return cards.map(({ netRoi: _netRoi, ...card }) => ({
    ...card,
    badge: badges.get(card.id)
  }));
}

export type EndedStrategyCardData = Omit<
  AvailableStrategyCardData,
  "badge"
> & {
  variant: Extract<StrategyCardVariant, "winner" | "loss">;
  winnerTeam: StrategyCardTeamRef;
};

export function buildEndedStrategyCards(
  snapshots: TeamMarketSnapshot[],
  tournamentWinner: CuratedTeamEntry
): EndedStrategyCardData[] {
  const snapshotByTeamId = buildSnapshotByTeamId(snapshots);
  const winnerTeam = mapCuratedTeamToRef(tournamentWinner);

  return Object.entries(STRATEGY_DATA).map(([id, entry]) => {
    const metricsInput = buildStrategyMetricsInput(entry, snapshots);
    const allocation = computeStrategyAllocation(metricsInput);
    const legs = markTournamentWinnerLegs(
      mapStrategyTeamsToLegs(entry.teams, snapshotByTeamId, allocation),
      entry.teams,
      tournamentWinner
    );
    const variant: EndedStrategyCardData["variant"] = strategyIncludesWinner(
      entry.teams,
      tournamentWinner
    )
      ? "winner"
      : "loss";

    return {
      id,
      ...entry,
      variant,
      winnerTeam,
      teamRefs: mapStrategyTeamsToRefs(entry.teams),
      legs,
      budgetLabel: formatStrategyBudget(entry.budget),
      estimatedRoiLabel: calculateEstimatedRoiLabel(metricsInput),
      hitReturnLabel: calculateHitReturnLabel(metricsInput)
    };
  });
}
