import { resolveThirdPlaceOption } from "@/lib/world-cup-path/calculate-path";

import { DEFAULT_THIRD_PLACE_GROUPS } from "./path-config";
import type { GroupPlacements } from "../types";

/**
 * Bump when confirmed group-stage inputs or confirmed knockout results change
 * (see fixed-knockout.ts) and persisted knockout picks must reset.
 */
export const ROAD_TO_FINAL_BRACKET_VERSION = 12;

// Final 2026 World Cup group-stage standings used to resolve confirmed Round of 32 matchups.
export const CONFIRMED_GROUP_PLACEMENTS: GroupPlacements = {
  A: {
    first: "mexico",
    second: "south-africa",
    third: "south-korea",
    fourth: "czechia"
  },
  B: {
    first: "switzerland",
    second: "canada",
    third: "bosnia-herzegovina",
    fourth: "qatar"
  },
  C: {
    first: "brazil",
    second: "morocco",
    third: "haiti",
    fourth: "scotland"
  },
  D: {
    first: "usa",
    second: "australia",
    third: "paraguay",
    fourth: "turkiye"
  },
  E: {
    first: "germany",
    second: "ivory-coast",
    third: "ecuador",
    fourth: "curacao"
  },
  F: {
    first: "netherlands",
    second: "japan",
    third: "sweden",
    fourth: "tunisia"
  },
  G: {
    first: "belgium",
    second: "egypt",
    third: "iran",
    fourth: "new-zealand"
  },
  H: {
    first: "spain",
    second: "cape-verde",
    third: "saudi-arabia",
    fourth: "uruguay"
  },
  I: {
    first: "france",
    second: "norway",
    third: "senegal",
    fourth: "iraq"
  },
  J: {
    first: "argentina",
    second: "austria",
    third: "algeria",
    fourth: "jordan"
  },
  K: {
    first: "colombia",
    second: "portugal",
    third: "congo-dr",
    fourth: "uzbekistan"
  },
  L: {
    first: "england",
    second: "croatia",
    third: "ghana",
    fourth: "panama"
  }
};

export const FIXED_GROUP_PLACEMENTS: GroupPlacements = CONFIRMED_GROUP_PLACEMENTS;

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
