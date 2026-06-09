export const RECOMMEND_CATEGORY_ORDER = [
  "mostLikelyChampion",
  "darkHorse",
  "hardestPath",
  "topAdvantage"
] as const;

export type RecommendCategory = (typeof RECOMMEND_CATEGORY_ORDER)[number];

export const RECOMMEND_CATEGORY_LABELS: Record<RecommendCategory, string> = {
  mostLikelyChampion: "Most Likely Champion",
  darkHorse: "Dark Horse",
  hardestPath: "Hardest Path",
  topAdvantage: "Top Advantage"
};

export const COMPETITIVENESS_SECTION_META = {
  death: {
    label: "Group of Death",
    description: "Teams are closely matched, creating maximum uncertainty."
  },
  easiest: {
    label: "Easiest Group",
    description: "The strength gap is more obvious."
  }
} as const;

export const NEWS_IMPACT_NEGATIVE_KEYWORDS = [
  "injury",
  "injured",
  "omitted",
  "doubt",
  "doubtful",
  "suspended",
  "miss",
  "missing",
  "setback",
  "out",
  "ruled out",
  "withdraw",
  "ban",
  "penalty",
  "noise penalty"
] as const;

export const NEWS_IMPACT_POSITIVE_KEYWORDS = [
  "return",
  "returns",
  "boost",
  "form",
  "recover",
  "recovery",
  "available",
  "fit",
  "cleared",
  "back in training",
  "full training"
] as const;

export const NEWS_HIGH_IMPACT_THRESHOLD = 75;

export const ANALYTICS_NEWS_PAGE_SIZE = 20;

export const ANALYTICS_QUERY_STALE_TIME_MS = 60_000;
