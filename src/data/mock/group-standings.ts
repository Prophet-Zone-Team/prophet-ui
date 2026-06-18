import type { GroupStandings } from "@/types/group-standings";
import { buildGroupStandingsFromWorldCup } from "@/views/home/groups/utils";

let cachedMockGroupStandings: GroupStandings[] | undefined;

export function getMockGroupStandings(): GroupStandings[] {
  if (!cachedMockGroupStandings) {
    cachedMockGroupStandings = buildGroupStandingsFromWorldCup();
  }

  return cachedMockGroupStandings;
}

export function clearMockGroupStandingsCache(): void {
  cachedMockGroupStandings = undefined;
}
