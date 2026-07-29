export const marketQueryKeys = {
  polymarketStats: () => ["market", "polymarket-stats"] as const,
  winnerProbability: () => ["market", "winner-probability"] as const,
  relatedGames: (teamsKey: string) =>
    ["market", "related-games", teamsKey] as const,
  groupStandings: (groupCode: string) =>
    ["market", "group-standings", groupCode] as const,
  gameStatistics: (slug: string) =>
    ["market", "game-statistics", slug] as const,
  gameOdds: (slug: string) => ["market", "game-odds", slug] as const,
  zettaSmartWallets: (slug: string) =>
    ["market", "zetta-smart-wallets", slug] as const,
  teamGameResults: (teamName: string) =>
    ["market", "team-game-results", teamName] as const,
  teamLineup: (teamName: string) =>
    ["market", "team-lineup", teamName] as const,
  groupMatches: (groupCode: string) =>
    ["market", "group-matches", groupCode] as const,
  footballMatches: (league: string, ended: boolean) =>
    ["market", "football-matches", league, ended] as const,
  groupWinner: (groupCode: string) =>
    ["market", "group-winner", groupCode] as const,
  groupGame: (groupCode: string) => ["market", "group-game", groupCode] as const
};
