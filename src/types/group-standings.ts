import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";

export type GroupStandingRow = {
  teamId: string;
  teamName: string;
  flagName: string;
  teamCode: string;
  logoUrl?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  advancingProbability: number;
};

export type GroupStandings = {
  group: WorldCup2026Group;
  rows: GroupStandingRow[];
};
