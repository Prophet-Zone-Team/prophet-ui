export type NewsSentiment = "positive" | "negative";

export type SignalSummaryStats = {
  todaySignal: number;
  positive: number;
  negative: number;
};

export type NewsImpactItem = {
  id: string;
  teamCode: string;
  teamName: string;
  sentiment: NewsSentiment;
  headline: string;
  summary: string;
  publishedAtLabel: string;
  impactScore: number;
  thumbnailUrl?: string;
  thumbnailAlt: string;
  highlighted?: boolean;
  publishedAt?: string;
  publishedAtFormatted?: string;
  sourceUrl?: string;
  category?: string;
  matchedTeams?: string[];
  matchedPlayers?: string[];
  reasons?: string[];
};

export type SignalNewsImpactData = {
  summary: SignalSummaryStats;
  items: NewsImpactItem[];
};
