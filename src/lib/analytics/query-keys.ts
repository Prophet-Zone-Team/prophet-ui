export const analyticsQueryKeys = {
  competitiveness: ["analytics", "competitiveness"] as const,
  recommends: ["analytics", "recommends"] as const,
  rankings: ["analytics", "team-power-rankings"] as const,
  teamPathContext: ["analytics", "team-path-context"] as const,
  latestNews: (category: string) =>
    ["analytics", "news", "latest", category] as const,
  newsPage: (
    page: number,
    pageSize: number,
    category: string,
    teams = ""
  ) => ["analytics", "news", page, pageSize, category, teams] as const,
  teamRelatedNews: (teamsKey: string) =>
    ["analytics", "news", "team-related", teamsKey] as const,
  newsTopCategoryImpact: ["analytics", "news", "top-category-impact"] as const,
  headToHead: (idsKey: string) =>
    ["game", "head-to-head", idsKey] as const,
  teamsStats: (teamsKey: string) =>
    ["analytics", "teams", "stats", teamsKey] as const,
  teamStatsByPolymarketIds: (idsKey: string) =>
    ["team", "stats", idsKey] as const,
  teamDetail: (teamName: string) => ["analytics", "team", teamName] as const,
  teamMarketNews: (teamName: string) =>
    ["analytics", "team-market-news", teamName] as const
};
