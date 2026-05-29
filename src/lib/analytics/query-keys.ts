export const analyticsQueryKeys = {
  competitiveness: ["analytics", "competitiveness"] as const,
  recommends: ["analytics", "recommends"] as const,
  rankings: ["analytics", "team-power-rankings"] as const,
  latestNews: (category: string) =>
    ["analytics", "news", "latest", category] as const,
  newsPage: (page: number, pageSize: number, category: string) =>
    ["analytics", "news", page, pageSize, category] as const
};
