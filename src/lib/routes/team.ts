import teamData from "@/data/teams";
import { curatedTeamKeyToId } from "@/data/teams/curated-team-list";

export function teamDetailHref(teamId: string) {
  return `/team?slug=${encodeURIComponent(teamId)}`;
}

export function buildTeamDetailHref(teamName?: string | null): string | undefined {
  const currentTeam = teamData[teamName as keyof typeof teamData];
  // Do not allow non-World Cup teams to access the detail page
  if (!currentTeam || !(currentTeam as unknown as any).isWorldCupTeam) {
    return void 0;
  }
  const teamId = curatedTeamKeyToId(currentTeam.name);
  return teamDetailHref(teamId);
}
