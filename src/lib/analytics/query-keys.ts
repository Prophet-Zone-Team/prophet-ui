export const analyticsQueryKeys = {
  competitiveness: ["analytics", "competitiveness"] as const,
  recommends: ["analytics", "recommends"] as const,
  rankings: ["analytics", "team-power-rankings"] as const,
  latestNews: (category: string) =>
    ["analytics", "news", "latest", category] as const,
  newsPage: (page: number, pageSize: number, category: string) =>
    ["analytics", "news", page, pageSize, category] as const,
  teamRelatedNews: (teamsKey: string) =>
    ["analytics", "news", "team-related", teamsKey] as const,
  headToHead: (teamA: string, teamB: string) =>
    ["analytics", "fixtures", "head-to-head", teamA, teamB] as const
};
