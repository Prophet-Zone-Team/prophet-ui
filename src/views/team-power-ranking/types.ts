export type TeamPowerRankingTrend = "up" | "down" | "neutral" | "new";

export type TeamPowerRankingPathDifficulty = "Medium" | "Hard";

export type TeamPowerRankingSignalStatus = "Positive" | "Negative";

export type TeamPowerRankingEntry = {
  id: string;
  rank: number;
  teamCode: string;
  teamName: string;
  group: string;
  titleProbability: number;
  roundOf16Probability: number;
  pathDifficulty: TeamPowerRankingPathDifficulty;
  trend: TeamPowerRankingTrend;
  signalStatus: TeamPowerRankingSignalStatus;
  link?: string;
};

export type TeamPowerRankingFilters = {
  teamId: string;
  group: string;
};
