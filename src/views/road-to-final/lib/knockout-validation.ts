import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";

import { getMatchCandidateTeams } from "./bracket-resolver";
import { POST_R32_ROUNDS, R32_ROUNDS } from "./knockout-shortcuts";
import type { GroupPlacements, KnockoutWinners } from "../types";

const KNOCKOUT_ROUNDS = [...R32_ROUNDS, ...POST_R32_ROUNDS] as const;

export function getUnpickedKnockoutMatchIds(
  placements: GroupPlacements,
  thirdPlaceOption: ThirdPlaceAllocationOption | undefined,
  knockoutWinners: KnockoutWinners
): number[] {
  if (!thirdPlaceOption) {
    return [];
  }

  const unpicked: number[] = [];

  for (const round of KNOCKOUT_ROUNDS) {
    for (const match of round) {
      const candidates = getMatchCandidateTeams(
        match,
        placements,
        thirdPlaceOption,
        knockoutWinners
      );

      if (candidates.length >= 2 && !knockoutWinners[match.matchId]) {
        unpicked.push(match.matchId);
      }
    }
  }

  return unpicked;
}
