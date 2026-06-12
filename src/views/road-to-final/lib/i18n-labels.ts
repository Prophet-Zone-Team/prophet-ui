import type { FinishType, PathResult } from "@/types/market";

import type { BracketColumnConfig, BracketRoundKey } from "../types";

type RoadToFinalTranslator = (key: string, values?: Record<string, string | number>) => string;

export function translateFinish(finishType: FinishType, t: RoadToFinalTranslator) {
  if (finishType === "GROUP_WINNER") {
    return t("finishGroupWinner");
  }

  if (finishType === "RUNNER_UP") {
    return t("finishRunnerUp");
  }

  return t("finishBestThird");
}

export function translateRouteDifficulty(result: PathResult | undefined, t: RoadToFinalTranslator) {
  const possibleOpponents =
    result?.rounds.reduce(
      (sum, round) => sum + round.possibleOpponentTeams.length,
      0
    ) ?? 0;

  if (possibleOpponents >= 80) {
    return t("routeDifficultyWideOpen");
  }

  if (possibleOpponents >= 40) {
    return t("routeDifficultyModerate");
  }

  return t("routeDifficultyNarrow");
}

export function translateRoundLabel(
  round: keyof typeof ROUND_KEY_MAP,
  t: RoadToFinalTranslator
) {
  return t(ROUND_KEY_MAP[round]);
}

export function translateColumnLabel(column: BracketColumnConfig, t: RoadToFinalTranslator) {
  return t(COLUMN_KEY_MAP[column.key]);
}

export function translateBracketSeedLabel(
  label: string,
  seed: string,
  t: RoadToFinalTranslator
) {
  if (label === "Best third") {
    return t("bestThird");
  }

  const winnerMatch = label.match(/^Winner M(\d+)$/);

  if (winnerMatch) {
    return t("winnerMatch", { matchId: winnerMatch[1] });
  }

  const loserMatch = label.match(/^Loser M(\d+)$/);

  if (loserMatch) {
    return t("loserMatch", { matchId: loserMatch[1] });
  }

  const ordinalGroupMatch = label.match(/^(1st|2nd|3rd|4th) ([A-L])$/);

  if (ordinalGroupMatch) {
    return t("ordinalGroup", {
      ordinal: ordinalGroupMatch[1],
      group: ordinalGroupMatch[2]
    });
  }

  if (label === seed) {
    return label;
  }

  return label;
}

export function translateShareStageLabel(
  stageKey: string,
  label: string,
  t: RoadToFinalTranslator
) {
  if (stageKey === "GROUP") {
    const groupMatch = label.match(/^GROUP ([A-L])$/);

    if (groupMatch) {
      return t("groupStageLabel", { group: groupMatch[1] });
    }
  }

  const roundKey = stageKey as keyof typeof ROUND_KEY_MAP;

  if (roundKey in ROUND_KEY_MAP) {
    return translateRoundLabel(roundKey, t).toUpperCase();
  }

  return label;
}

const ROUND_KEY_MAP = {
  R32: "roundOf32",
  R16: "roundOf16",
  QF: "quarterFinal",
  SF: "semiFinal",
  FINAL: "final"
} as const;

const COLUMN_KEY_MAP: Record<BracketRoundKey, string> = {
  r32: "roundOf32",
  r16: "roundOf16",
  qf: "quarterFinal",
  sf: "semiFinal"
};
