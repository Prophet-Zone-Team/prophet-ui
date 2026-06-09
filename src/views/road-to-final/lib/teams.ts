import {
  getAllWorldCup2026Teams,
  getWorldCupTeamByIdOrCode
} from "@/data/world-cup-2026/groups";

import type { SimulatorTeam } from "../types";

export const defaultSimulatorTeamId = "brazil";

export const simulatorTeams: SimulatorTeam[] = getAllWorldCup2026Teams().map(
  (team) => ({
    id: team.id,
    teamCode: team.code,
    teamName: team.name
  })
);

export function getSimulatorTeamById(teamId: string): SimulatorTeam | undefined {
  const team = getWorldCupTeamByIdOrCode(teamId);

  if (!team) {
    return undefined;
  }

  return {
    id: team.id,
    teamCode: team.code,
    teamName: team.name
  };
}

export function resolveSimulatorTeamId(teamId: string): string {
  return getWorldCupTeamByIdOrCode(teamId)?.id ?? defaultSimulatorTeamId;
}
