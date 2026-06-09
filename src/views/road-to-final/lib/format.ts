import type { FinishType, PathResult } from "@/types/market";

export const ROUND_LABELS = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarterfinal",
  SF: "Semifinal",
  FINAL: "Final"
} as const;

export const SHORT_ROUND_LABELS = {
  R32: "R32",
  R16: "R16",
  QF: "QF",
  SF: "SF",
  FINAL: "Final"
} as const;

export function formatFinish(finishType: FinishType) {
  if (finishType === "GROUP_WINNER") {
    return "Group winner";
  }

  if (finishType === "RUNNER_UP") {
    return "Runner-up";
  }

  return "Best third";
}

export function getRouteDifficulty(result?: PathResult) {
  const possibleOpponents =
    result?.rounds.reduce(
      (sum, round) => sum + round.possibleOpponentTeams.length,
      0
    ) ?? 0;

  if (possibleOpponents >= 80) {
    return "Wide open";
  }

  if (possibleOpponents >= 40) {
    return "Moderate";
  }

  return "Narrow";
}

const STRONG_OPPONENT_NAMES = [
  "France",
  "Argentina",
  "England",
  "Spain",
  "Germany",
  "Brazil"
];

export function getStrongestOpponent(result?: PathResult) {
  return result?.rounds
    .flatMap((round) => round.possibleOpponentTeams)
    .find((team) => STRONG_OPPONENT_NAMES.includes(team.teamName));
}
