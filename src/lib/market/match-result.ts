export type MatchResultWinner = "home" | "away" | "draw";

export type TeamMatchOutcome = "win" | "lose" | "draw";

/** Aligns with MatchProbabilityBar home / draw / away segment colors. */
export const MATCH_RESULT_BAR_COLORS: Record<MatchResultWinner, string> = {
  home: "#3168FF",
  draw: "#D9D9D9",
  away: "#F4B600"
};

export function resolveMatchResultWinner(
  homeScore?: number,
  awayScore?: number
): MatchResultWinner | undefined {
  if (homeScore === undefined || awayScore === undefined) {
    return undefined;
  }

  if (homeScore > awayScore) {
    return "home";
  }

  if (awayScore > homeScore) {
    return "away";
  }

  return "draw";
}

export function getTeamMatchOutcome(
  side: "home" | "away",
  winner: MatchResultWinner
): TeamMatchOutcome {
  if (winner === "draw") {
    return "draw";
  }

  if (winner === "home") {
    return side === "home" ? "win" : "lose";
  }

  return side === "away" ? "win" : "lose";
}

export function getOutcomePillLabel(outcome: TeamMatchOutcome): string {
  switch (outcome) {
    case "win":
      return "Win";
    case "lose":
      return "Lose";
    default:
      return "Draw";
  }
}

export function getOutcomePillStyles(outcome: TeamMatchOutcome): {
  background: string;
  color: string;
} {
  switch (outcome) {
    case "win":
      return { background: "#E5F4D6", color: "#4A7C1B" };
    case "lose":
      return { background: "#FFE8E8", color: "#C62828" };
    default:
      return { background: "#EBEBEB", color: "#606060" };
  }
}

export function getMatchResultBarColor(
  winner: MatchResultWinner | undefined
): string {
  if (!winner) {
    return MATCH_RESULT_BAR_COLORS.draw;
  }

  return MATCH_RESULT_BAR_COLORS[winner];
}
