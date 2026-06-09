import { calculateWorldCupPath } from "@/lib/world-cup-path/calculate-path";
import type { FinishType, PathMode, PathResult } from "@/types/market";

import type { GroupPlacements } from "../types";
import { toExactGroupPlacements } from "./placements";

export function safeCalculatePath({
  placements,
  teamId,
  finishType,
  thirdGroups
}: {
  placements: GroupPlacements;
  teamId: string;
  finishType: FinishType;
  thirdGroups: string[];
}): { result?: PathResult; error?: string } {
  try {
    return {
      result: calculateWorldCupPath({
        teamId,
        finishType,
        mode: "SCENARIO",
        scenario: {
          qualifiedThirdGroups: thirdGroups,
          exactGroupPlacements: toExactGroupPlacements(placements)
        }
      })
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to calculate this path."
    };
  }
}

export type { PathMode, PathResult, FinishType };
