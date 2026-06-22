import { KNOCKOUT_LINKS } from "@/data/world-cup-2026/knockout-links";
import { ROUND_OF_32 } from "@/data/world-cup-2026/round-of-32";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";

import { getMatchCandidateTeams } from "./bracket-resolver";
import type { GroupPlacements, KnockoutWinners } from "../types";
import {
  chooseKnockoutWinner,
  type KnockoutPickMethod
} from "./team-strength";

const KNOCKOUT_ROUNDS = [
  ROUND_OF_32,
  KNOCKOUT_LINKS.filter((match) => match.stage === "R16"),
  KNOCKOUT_LINKS.filter((match) => match.stage === "QF"),
  KNOCKOUT_LINKS.filter((match) => match.stage === "SF"),
  KNOCKOUT_LINKS.filter((match) => match.stage === "FINAL")
] as const;

export function applyKnockoutShortcut({
  placements,
  thirdPlaceOption,
  method
}: {
  placements: GroupPlacements;
  thirdPlaceOption: ThirdPlaceAllocationOption;
  method: KnockoutPickMethod;
}): KnockoutWinners {
  const winners: KnockoutWinners = {};

  for (const round of KNOCKOUT_ROUNDS) {
    for (const match of round) {
      const candidates = getMatchCandidateTeams(
        match,
        placements,
        thirdPlaceOption,
        winners
      );
      const winner = chooseKnockoutWinner(candidates, method);

      if (winner) {
        winners[match.matchId] = winner.id;
      }
    }
  }

  return winners;
}

export function getChampionTeamId(knockoutWinners: KnockoutWinners): string | undefined {
  return knockoutWinners[104];
}
