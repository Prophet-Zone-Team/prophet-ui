type AnalyticsTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

const GROUP_STAGE_KEYS: Record<string, string> = {
  "Group Stage 1st": "groupStageFirst",
  "Group Stage 2nd": "groupStageSecond",
  "Group Stage 3rd": "groupStageThird",
  "Group Stage 4th": "groupStageFourth",
};

const KNOCKOUT_ROUND_KEYS: Record<string, string> = {
  "Round of 32": "roundOf32",
  "Round of 16": "roundOf16",
  "Quarter Final": "quarterFinal",
  Quarterfinal: "quarterFinal",
  "Semi Final": "semiFinal",
  Semifinal: "semiFinal",
  Final: "final",
};

export function translateSimulatorCurrentStage(
  stage: string,
  t: AnalyticsTranslator,
): string {
  if (!stage || stage === "—") {
    return stage;
  }

  const key = GROUP_STAGE_KEYS[stage];

  return key ? t(key) : stage;
}

export function translateSimulatorKnockoutRound(
  round: string,
  t: AnalyticsTranslator,
): string {
  const key = KNOCKOUT_ROUND_KEYS[round.trim()];

  return key ? t(key) : round.trim();
}

export function formatLocalizedBiggestOpponent(
  input: {
    name?: string;
    round?: string;
  },
  localizedTeamName: string,
  t: AnalyticsTranslator,
): string {
  if (!input.name?.trim()) {
    return t("tbd");
  }

  if (!input.round?.trim()) {
    return localizedTeamName;
  }

  return `${localizedTeamName} (${translateSimulatorKnockoutRound(input.round, t)})`;
}
