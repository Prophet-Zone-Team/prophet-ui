import { resolveThirdPlaceOption } from "@/lib/world-cup-path/calculate-path";

import { createDefaultPlacements } from "./placements";
import { DEFAULT_THIRD_PLACE_GROUPS } from "./path-config";
import type { GroupPlacements } from "../types";

// Replace with real group-stage results when available.
export const FIXED_GROUP_PLACEMENTS: GroupPlacements = createDefaultPlacements();

export const FIXED_THIRD_PLACE_GROUPS: string[] = [
  ...DEFAULT_THIRD_PLACE_GROUPS
];

const fixedThirdPlaceOption = resolveThirdPlaceOption(FIXED_THIRD_PLACE_GROUPS);

if (!fixedThirdPlaceOption) {
  throw new Error(
    "Fixed third-place groups do not resolve to a valid Annexe C option."
  );
}

export { fixedThirdPlaceOption };
