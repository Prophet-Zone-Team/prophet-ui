import {
  WORLD_CUP_2026_GROUPS,
  WORLD_CUP_2026_GROUP_ORDER,
  type WorldCup2026Group
} from "@/data/world-cup-2026/groups";
import type { FinishType } from "@/types/market";

import {
  PLACEMENT_OPTIONS,
  type GroupPlacements,
  type Placement
} from "../types";

export function createDefaultPlacements(): GroupPlacements {
  return Object.fromEntries(
    WORLD_CUP_2026_GROUP_ORDER.map((group) => [
      group,
      {
        first: WORLD_CUP_2026_GROUPS[group][0]?.id ?? "",
        second: WORLD_CUP_2026_GROUPS[group][1]?.id ?? "",
        third: WORLD_CUP_2026_GROUPS[group][2]?.id ?? "",
        fourth: WORLD_CUP_2026_GROUPS[group][3]?.id ?? ""
      }
    ])
  ) as GroupPlacements;
}

export function createSeededPlacements(): GroupPlacements {
  return createDefaultPlacements();
}

export function updateGroupPlacement(
  current: GroupPlacements,
  group: WorldCup2026Group,
  placement: Placement,
  nextTeamId: string
): GroupPlacements {
  const currentGroup = current[group];
  const previousPlacement = PLACEMENT_OPTIONS.find(
    (item) => currentGroup[item.key] === nextTeamId
  )?.key;
  const nextGroup = { ...currentGroup };
  const previousTeamId = nextGroup[placement];

  nextGroup[placement] = nextTeamId;

  if (previousPlacement && previousPlacement !== placement) {
    nextGroup[previousPlacement] = previousTeamId;
  }

  return {
    ...current,
    [group]: nextGroup
  };
}

export function toExactGroupPlacements(placements: GroupPlacements) {
  return Object.fromEntries(
    WORLD_CUP_2026_GROUP_ORDER.map((group) => [
      group,
      {
        first: placements[group].first,
        second: placements[group].second,
        third: placements[group].third
      }
    ])
  );
}

export function getFinishForTeam(
  placements: GroupPlacements,
  teamId: string
): FinishType | undefined {
  for (const group of WORLD_CUP_2026_GROUP_ORDER) {
    const placement = PLACEMENT_OPTIONS.find(
      (item) => placements[group][item.key] === teamId
    );

    if (placement?.finishType) {
      return placement.finishType;
    }
  }

  return undefined;
}

export function toggleThirdGroup(
  selectedGroups: string[],
  group: string
): string[] {
  if (selectedGroups.includes(group)) {
    return selectedGroups.filter((item) => item !== group);
  }

  if (selectedGroups.length >= 8) {
    return [...selectedGroups.slice(1), group].sort();
  }

  return [...selectedGroups, group].sort();
}
