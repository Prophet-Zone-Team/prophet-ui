import teamData from "@/data/teams";
import { curatedTeamKeyToId } from "@/data/teams/curated-team-list";

export function teamDetailHref(teamId: string) {
  return `/team?slug=${encodeURIComponent(teamId)}`;
}

export function buildTeamDetailHref(teamName?: string | null): string | undefined {
  const currentTeam = teamData[teamName as keyof typeof teamData];
  if (!currentTeam) {
    return void 0;
  }
  const teamId = curatedTeamKeyToId(currentTeam.name);
  return teamDetailHref(teamId);
}
