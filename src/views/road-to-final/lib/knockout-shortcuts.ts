import { KNOCKOUT_LINKS } from "@/data/world-cup-2026/knockout-links";
import { ROUND_OF_32 } from "@/data/world-cup-2026/round-of-32";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";

import { getMatchCandidateTeams } from "./bracket-resolver";
import {
  isFixedKnockoutMatch,
  mergeWithFixedKnockoutWinners,
} from "./fixed-knockout";
import type { GroupPlacements, KnockoutWinners } from "../types";
import {
  chooseKnockoutWinner,
  type KnockoutPickMethod
} from "./team-strength";

export const R32_ROUNDS = [ROUND_OF_32] as const;

export const POST_R32_ROUNDS = [
  KNOCKOUT_LINKS.filter((match) => match.stage === "R16"),
  KNOCKOUT_LINKS.filter((match) => match.stage === "QF"),
  KNOCKOUT_LINKS.filter((match) => match.stage === "SF"),
  KNOCKOUT_LINKS.filter((match) => match.stage === "FINAL")
] as const;

const KNOCKOUT_ROUNDS = [...R32_ROUNDS, ...POST_R32_ROUNDS] as const;

export const R32_MATCH_ID_MIN = 73;
export const R32_MATCH_ID_MAX = 88;

export function isR32MatchId(matchId: number): boolean {
  return matchId >= R32_MATCH_ID_MIN && matchId <= R32_MATCH_ID_MAX;
}

function applyKnockoutRounds({
  rounds,
  placements,
  thirdPlaceOption,
  baseWinners,
  method
}: {
  rounds: readonly (readonly { matchId: number; left: string; right: string }[])[];
  placements: GroupPlacements;
  thirdPlaceOption: ThirdPlaceAllocationOption;
  baseWinners: KnockoutWinners;
  method: KnockoutPickMethod;
}): KnockoutWinners {
  const winners: KnockoutWinners = mergeWithFixedKnockoutWinners(baseWinners);

  for (const round of rounds) {
    for (const match of round) {
      if (isFixedKnockoutMatch(match.matchId)) {
        continue;
      }

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

  return mergeWithFixedKnockoutWinners(winners);
}

export function applyKnockoutShortcut({
  placements,
  thirdPlaceOption,
  method
}: {
  placements: GroupPlacements;
  thirdPlaceOption: ThirdPlaceAllocationOption;
  method: KnockoutPickMethod;
}): KnockoutWinners {
  return applyKnockoutRounds({
    rounds: KNOCKOUT_ROUNDS,
    placements,
    thirdPlaceOption,
    baseWinners: {},
    method
  });
}

export function applyR32KnockoutShortcut({
  placements,
  thirdPlaceOption,
  method
}: {
  placements: GroupPlacements;
  thirdPlaceOption: ThirdPlaceAllocationOption;
  method: KnockoutPickMethod;
}): KnockoutWinners {
  return applyKnockoutRounds({
    rounds: R32_ROUNDS,
    placements,
    thirdPlaceOption,
    baseWinners: {},
    method
  });
}

export function applyPostR32KnockoutShortcut({
  placements,
  thirdPlaceOption,
  baseWinners,
  method
}: {
  placements: GroupPlacements;
  thirdPlaceOption: ThirdPlaceAllocationOption;
  baseWinners: KnockoutWinners;
  method: KnockoutPickMethod;
}): KnockoutWinners {
  return applyKnockoutRounds({
    rounds: POST_R32_ROUNDS,
    placements,
    thirdPlaceOption,
    baseWinners,
    method
  });
}

export function extractR32Winners(winners: KnockoutWinners): KnockoutWinners {
  return Object.fromEntries(
    Object.entries(winners).filter(([matchId]) => isR32MatchId(Number(matchId)))
  );
}

export function extractPostR32Winners(
  winners: KnockoutWinners
): KnockoutWinners {
  return Object.fromEntries(
    Object.entries(winners).filter(([matchId]) => !isR32MatchId(Number(matchId)))
  );
}

export function getChampionTeamId(knockoutWinners: KnockoutWinners): string | undefined {
  return knockoutWinners[104];
}
