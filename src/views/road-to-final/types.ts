import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import type { FinishType } from "@/types/market";

export type SimulatorTeam = {
  id: string;
  teamCode: string;
  teamName: string;
};

export type Placement = "first" | "second" | "third" | "fourth";

export type GroupPlacements = Record<WorldCup2026Group, Record<Placement, string>>;

export type BracketSide = "left" | "right" | "center";

export type BracketRoundKey = "r32" | "r16" | "qf" | "sf";

export type BracketMatchConfig = {
  matchId: number;
  left: string;
  right: string;
  stage?: string;
  venue?: string;
};

export type BracketColumnConfig = {
  key: BracketRoundKey;
  label: string;
  matchIds: number[];
};

export type KnockoutWinners = Record<number, string>;

export type PlacementOption = {
  key: Placement;
  label: string;
  finishType?: FinishType;
};

export const PLACEMENT_OPTIONS: PlacementOption[] = [
  { key: "first", label: "1st", finishType: "GROUP_WINNER" },
  { key: "second", label: "2nd", finishType: "RUNNER_UP" },
  { key: "third", label: "3rd", finishType: "BEST_THIRD" },
  { key: "fourth", label: "4th" }
];
