export type ImpactSentiment = "positive" | "negative";

export type ImpactDistributionSegment = {
  sentiment: ImpactSentiment;
  count: number;
};

export type ImpactDistributionOverviewData = {
  segments: ImpactDistributionSegment[];
};
