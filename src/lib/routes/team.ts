import teamData from "@/data/teams";
import { curatedTeamKeyToId } from "@/data/teams/curated-team-list";

const TEAM_DETAIL_SLUG_ALIASES: Record<string, string> = {
  "united-states": "usa",
  "korea-republic": "south-korea",
  "cote-d-ivoire": "ivory-coast",
  "cabo-verde": "cape-verde",
  "ir-iran": "iran",
  congo: "congo-dr",
  "dr-congo": "congo-dr",
};

export function resolveTeamDetailSlug(slug: string): string {
  return TEAM_DETAIL_SLUG_ALIASES[slug] ?? slug;
}

export function teamDetailHref(
  teamId: string,
  options?: { entry?: "trade" }
) {
  const params = new URLSearchParams({ slug: teamId });

  if (options?.entry === "trade") {
    params.set("entry", "trade");
  }

  return `/team?${params.toString()}`;
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
