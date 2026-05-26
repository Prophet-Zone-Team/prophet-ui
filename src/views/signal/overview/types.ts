export type ImpactSentiment = "positive" | "neutral" | "negative";

export type ImpactDistributionSegment = {
  sentiment: ImpactSentiment;
  count: number;
};

export type ImpactDistributionOverviewData = {
  segments: ImpactDistributionSegment[];
};
