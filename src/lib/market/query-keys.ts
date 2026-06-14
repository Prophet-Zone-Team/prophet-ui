export const marketQueryKeys = {
  polymarketStats: () => ["market", "polymarket-stats"] as const,
  relatedGames: (teamsKey: string) =>
    ["market", "related-games", teamsKey] as const,
  gameStatistics: (slug: string) =>
    ["market", "game-statistics", slug] as const,
  gameOdds: (slug: string) => ["market", "game-odds", slug] as const,
  zettaSmartWallets: (slug: string) =>
    ["market", "zetta-smart-wallets", slug] as const,
  teamGameResults: (teamName: string) =>
    ["market", "team-game-results", teamName] as const,
  teamLineup: (teamName: string) =>
    ["market", "team-lineup", teamName] as const
};
