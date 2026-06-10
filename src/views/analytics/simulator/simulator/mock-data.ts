import type { PathDifficulty } from "./types";

const pathDifficultyColor: Record<PathDifficulty, string> = {
  Easy: "#22C55E",
  Medium: "#F4B600",
  Hard: "#EF4444"
};

export function getPathDifficultyColor(difficulty: PathDifficulty): string {
  return pathDifficultyColor[difficulty];
}
