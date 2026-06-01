export const marketQueryKeys = {
  relatedGames: (teamsKey: string) =>
    ["market", "related-games", teamsKey] as const
};
