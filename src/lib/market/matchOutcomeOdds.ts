import type { MatchOddsOutcome, WorldCupMatch } from "../../types/market";

export interface MatchOutcomeProbabilities {
  home: number;
  draw: number;
  away: number;
}

export type ParseMatchOutcomeOddsResult =
  | { status: "ready"; probabilities: MatchOutcomeProbabilities }
  | { status: "unavailable" };

type OutcomeSlot = "home" | "draw" | "away";

const DRAW_LABELS = new Set(["draw", "x", "tie", "d"]);

export function parseMatchOutcomeOdds(
  match: WorldCupMatch,
  homeName?: string,
  awayName?: string
): ParseMatchOutcomeOddsResult {
  const outcomes = match.odds?.outcomes ?? [];
  const slots: Partial<Record<OutcomeSlot, number>> = {};

  for (const outcome of outcomes) {
    const slot = classifyOutcomeSlot(outcome, homeName, awayName);
    const raw = getRawImpliedProbability(outcome);

    if (!slot || raw === undefined) {
      continue;
    }

    slots[slot] = raw;
  }

  if (
    slots.home === undefined ||
    slots.draw === undefined ||
    slots.away === undefined
  ) {
    return { status: "unavailable" };
  }

  const sum = slots.home + slots.draw + slots.away;

  if (!Number.isFinite(sum) || sum <= 0) {
    return { status: "unavailable" };
  }

  return {
    status: "ready",
    probabilities: {
      home: slots.home / sum,
      draw: slots.draw / sum,
      away: slots.away / sum
    }
  };
}

export function formatOutcomePercent(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

function classifyOutcomeSlot(
  outcome: MatchOddsOutcome,
  homeName?: string,
  awayName?: string
): OutcomeSlot | undefined {
  const label = normalizeLabel(outcome.label);

  if (DRAW_LABELS.has(label) || label.includes("draw")) {
    return "draw";
  }

  if (label === "home" || label === "1" || label === "h") {
    return "home";
  }

  if (label === "away" || label === "2" || label === "a") {
    return "away";
  }

  const homeNormalized = homeName ? normalizeLabel(homeName) : undefined;
  const awayNormalized = awayName ? normalizeLabel(awayName) : undefined;

  if (homeNormalized && (label === homeNormalized || label.includes(homeNormalized))) {
    return "home";
  }

  if (awayNormalized && (label === awayNormalized || label.includes(awayNormalized))) {
    return "away";
  }

  return undefined;
}

function getRawImpliedProbability(outcome: MatchOddsOutcome): number | undefined {
  if (
    outcome.impliedProbability !== undefined &&
    Number.isFinite(outcome.impliedProbability)
  ) {
    return outcome.impliedProbability > 1
      ? outcome.impliedProbability / 100
      : outcome.impliedProbability;
  }

  if (
    outcome.decimalOdds !== undefined &&
    Number.isFinite(outcome.decimalOdds) &&
    outcome.decimalOdds > 0
  ) {
    return 1 / outcome.decimalOdds;
  }

  return undefined;
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}
