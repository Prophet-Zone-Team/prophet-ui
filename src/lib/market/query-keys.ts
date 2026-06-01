export const marketQueryKeys = {
  relatedGames: (teamsKey: string) =>
    ["market", "related-games", teamsKey] as const,
  gameStatistics: (slug: string) =>
    ["market", "game-statistics", slug] as const
};
