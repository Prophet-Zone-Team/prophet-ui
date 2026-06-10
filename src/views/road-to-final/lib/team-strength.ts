import { getTeamFootballMetadata } from "@/data/teams/football-metadata";
import type { WorldCup2026GroupTeam } from "@/data/world-cup-2026/groups";

export type KnockoutPickMethod = "manual" | "random" | "fifa" | "market" | "predicted";

export function getFifaRank(teamId: string): number {
  return getTeamFootballMetadata(teamId)?.fifaRank ?? 999;
}

export function getSquadValue(teamId: string): number {
  return getTeamFootballMetadata(teamId)?.squadValue ?? 0;
}

export function strengthScore(team: WorldCup2026GroupTeam): number {
  const market = getSquadValue(team.id);
  const fifa = getFifaRank(team.id);
  const fifaBoost = fifa < 999 ? (250 - fifa) * 2 : 0;

  return market + fifaBoost;
}

export function predictedWinner(
  candidates: WorldCup2026GroupTeam[]
): WorldCup2026GroupTeam | undefined {
  if (!candidates.length) {
    return undefined;
  }

  return [...candidates].sort((a, b) => strengthScore(b) - strengthScore(a))[0];
}

export function chooseKnockoutWinner(
  candidates: WorldCup2026GroupTeam[],
  method: KnockoutPickMethod
): WorldCup2026GroupTeam | undefined {
  if (!candidates.length) {
    return undefined;
  }

  if (method === "random") {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  if (method === "fifa") {
    return [...candidates].sort(
      (a, b) => getFifaRank(a.id) - getFifaRank(b.id)
    )[0];
  }

  if (method === "market") {
    return [...candidates].sort(
      (a, b) => getSquadValue(b.id) - getSquadValue(a.id)
    )[0];
  }

  return predictedWinner(candidates);
}
