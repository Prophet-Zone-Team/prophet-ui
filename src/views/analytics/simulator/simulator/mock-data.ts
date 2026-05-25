import {
  defaultSimulatorTeamId,
  simulatorTeams
} from "@/views/road-to-final/lib/teams";

import type { PathDifficulty, SimulatorSnapshot } from "./types";

export { defaultSimulatorTeamId, simulatorTeams };

const pathDifficultyColor: Record<PathDifficulty, string> = {
  Easy: "#22C55E",
  Medium: "#F4B600",
  Hard: "#EF4444"
};

export function getPathDifficultyColor(difficulty: PathDifficulty): string {
  return pathDifficultyColor[difficulty];
}

const snapshots: Record<string, SimulatorSnapshot> = {
  brazil: {
    currentStage: "Group Stage 1st",
    pathDifficulty: "Medium",
    biggestOpponent: "France (Quater Final)"
  },
  france: {
    currentStage: "Group Stage 1st",
    pathDifficulty: "Hard",
    biggestOpponent: "Brazil (Quater Final)"
  },
  spain: {
    currentStage: "Group Stage 2nd",
    pathDifficulty: "Medium",
    biggestOpponent: "Germany (Semi Final)"
  },
  england: {
    currentStage: "Group Stage 1st",
    pathDifficulty: "Medium",
    biggestOpponent: "France (Semi Final)"
  },
  argentina: {
    currentStage: "Group Stage 1st",
    pathDifficulty: "Easy",
    biggestOpponent: "Spain (Quater Final)"
  }
};

const defaultSnapshot: SimulatorSnapshot = {
  currentStage: "Group Stage 2nd",
  pathDifficulty: "Medium",
  biggestOpponent: "TBD"
};

export function getSimulatorSnapshot(teamId: string): SimulatorSnapshot {
  return snapshots[teamId] ?? defaultSnapshot;
}

