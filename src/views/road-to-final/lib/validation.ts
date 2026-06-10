import { WORLD_CUP_2026_GROUP_ORDER } from "@/data/world-cup-2026/groups";
import { resolveThirdPlaceOption } from "@/lib/world-cup-path/calculate-path";

import { PLACEMENT_OPTIONS, type GroupPlacements } from "../types";

const RANK_KEYS = PLACEMENT_OPTIONS.map((option) => option.key);

export function getPlacementValidation(
  placements: GroupPlacements,
  thirdGroups: string[]
): string[] {
  const errors: string[] = [];

  for (const group of WORLD_CUP_2026_GROUP_ORDER) {
    const ids = RANK_KEYS.map((rank) => placements[group]?.[rank]).filter(Boolean);

    if (ids.length !== 4 || new Set(ids).size !== 4) {
      errors.push(`Group ${group} ranking is incomplete or has duplicates`);
    }
  }

  if (thirdGroups.length !== 8) {
    errors.push("Exactly 8 third-place groups must advance");
  }

  if (thirdGroups.length === 8 && !resolveThirdPlaceOption(thirdGroups)) {
    errors.push("Current third-place combination has no matching Annexe C option");
  }

  return errors;
}

export function isStepOneComplete(
  placements: GroupPlacements,
  thirdGroups: string[]
): boolean {
  return getPlacementValidation(placements, thirdGroups).length === 0;
}
