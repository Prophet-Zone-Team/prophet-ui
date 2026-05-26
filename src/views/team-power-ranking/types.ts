export type TeamPowerRankingTrend = "up" | "down" | "neutral";

export type TeamPowerRankingPathDifficulty = "moderate" | "hard";

export type TeamPowerRankingSignalStatus = "positive" | "negative" | "neutral";

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
};

export type TeamPowerRankingFilters = {
  teamId: string;
  group: string;
};
