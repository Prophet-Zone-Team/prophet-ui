export type TeamPowerRankingTrend = "up" | "down";

export type TeamPowerRankingEntry = {
  id: string;
  rank: number;
  teamCode: string;
  teamName: string;
  titleProbability: number;
  roundOf16Probability: number;
  trend: TeamPowerRankingTrend;
};
