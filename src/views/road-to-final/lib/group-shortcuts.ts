import {
  WORLD_CUP_2026_GROUPS,
  WORLD_CUP_2026_GROUP_ORDER,
  type WorldCup2026Group,
  type WorldCup2026GroupTeam
} from "@/data/world-cup-2026/groups";

import { getFifaRank, getSquadValue } from "./team-strength";
import type { GroupPlacements } from "../types";

export function deriveBestThirdGroups(
  placements: GroupPlacements,
  method: string
): string[] {
  const scored = WORLD_CUP_2026_GROUP_ORDER.map((group) => {
    const teamId = placements[group].third;
    const usesFifa =
      method === "fifaRank" ||
      method.includes("FIFA") ||
      method.includes("rank") ||
      method.includes("排名");
    const usesMarket =
      method === "squadValueRanking" ||
      method.includes("market") ||
      method.includes("value") ||
      method.includes("身价");
    const score = usesFifa
      ? -getFifaRank(teamId)
      : usesMarket
        ? getSquadValue(teamId)
        : Math.random();

    return { group, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.group)
    .sort();
}

export function sortPlacementsBy(
  sorter: (a: WorldCup2026GroupTeam, b: WorldCup2026GroupTeam) => number
): GroupPlacements {
  return Object.fromEntries(
    WORLD_CUP_2026_GROUP_ORDER.map((group) => {
      const sorted = [...WORLD_CUP_2026_GROUPS[group as WorldCup2026Group]].sort(
        sorter
      );

      return [
        group,
        {
          first: sorted[0]?.id ?? "",
          second: sorted[1]?.id ?? "",
          third: sorted[2]?.id ?? "",
          fourth: sorted[3]?.id ?? ""
        }
      ];
    })
  ) as GroupPlacements;
}
