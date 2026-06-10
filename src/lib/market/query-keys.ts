export const marketQueryKeys = {
  relatedGames: (teamsKey: string) =>
    ["market", "related-games", teamsKey] as const,
  gameStatistics: (slug: string) =>
    ["market", "game-statistics", slug] as const,
  gameOdds: (slug: string) => ["market", "game-odds", slug] as const,
  teamGameResults: (teamName: string) =>
    ["market", "team-game-results", teamName] as const
};
