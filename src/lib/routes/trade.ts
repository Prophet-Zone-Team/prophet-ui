import { curatedTeamsById } from "@/data/teams/curated-team-list";

export function gameTradeHref(matchId: string) {
  return `/trade/game?slug=${encodeURIComponent(matchId)}`;
}

export function teamTradeHref(teamId: string) {
  return `/trade/team?slug=${encodeURIComponent(teamId)}`;
}

export function resolveTradeHref(slug: string) {
  if (curatedTeamsById.has(slug)) {
    return teamTradeHref(slug);
  }

  return gameTradeHref(slug);
}
