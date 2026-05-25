import { worldCupTeams } from "@/data/teams/world-cup-teams";

export function gameTradeHref(matchId: string) {
  return `/trade/game?slug=${encodeURIComponent(matchId)}`;
}

export function teamTradeHref(teamId: string) {
  return `/trade/team?slug=${encodeURIComponent(teamId)}`;
}

export function resolveTradeHref(slug: string) {
  if (worldCupTeams.some((team) => team.id === slug)) {
    return teamTradeHref(slug);
  }

  return gameTradeHref(slug);
}
