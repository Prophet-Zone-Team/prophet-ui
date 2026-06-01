const INVALID_TEAM_NAME = "TBD";

export function buildRelatedGamesTeamsQuery(teamNames: string[]): string {
  return teamNames
    .map((name) => name.trim())
    .filter((name) => name && name !== INVALID_TEAM_NAME)
    .join(",");
}
