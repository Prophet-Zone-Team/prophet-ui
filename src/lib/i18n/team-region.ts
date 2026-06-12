import type { TeamRegion } from "@/types/market";

export const TEAM_REGION_MESSAGE_KEYS: Record<TeamRegion, string> = {
  Africa: "africa",
  Asia: "asia",
  Europe: "europe",
  "North America": "northAmerica",
  "South America": "southAmerica"
};

export function getTeamRegionMessageKey(region: TeamRegion): string {
  return TEAM_REGION_MESSAGE_KEYS[region];
}
