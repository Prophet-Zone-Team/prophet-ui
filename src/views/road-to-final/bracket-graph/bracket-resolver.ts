import {
  getWorldCupTeamByIdOrCode,
  type WorldCup2026Group,
  type WorldCup2026GroupTeam
} from "@/data/world-cup-2026/groups";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import { resolveThirdPlaceOption } from "@/lib/world-cup-path/calculate-path";
import type { PathResult } from "@/types/market";

import {
  MATCH_LOOKUP,
  THIRD_PLACE_WINNER_SEEDS
} from "../lib/bracket-config";
import type {
  BracketMatchConfig,
  GroupPlacements,
  KnockoutWinners,
  Placement
} from "../types";
import { SHORT_ROUND_LABELS } from "../lib/format";

export function getMatchStage(
  match?: BracketMatchConfig
): keyof typeof SHORT_ROUND_LABELS | undefined {
  if (!match) {
    return undefined;
  }

  if (match.matchId >= 73 && match.matchId <= 88) {
    return "R32";
  }

  if (match.matchId >= 89 && match.matchId <= 96) {
    return "R16";
  }

  if (match.matchId >= 97 && match.matchId <= 100) {
    return "QF";
  }

  if (match.matchId >= 101 && match.matchId <= 102) {
    return "SF";
  }

  if (match.matchId === 104) {
    return "FINAL";
  }

  return undefined;
}

export function isActiveSlot(
  seed: string,
  activeMatchIds: Set<number>,
  result: PathResult
): boolean {
  if (seed === result.seed) {
    return true;
  }

  const sourceMatchId = Number(seed.slice(1));

  if (
    (seed.startsWith("W") || seed.startsWith("L")) &&
    activeMatchIds.has(sourceMatchId)
  ) {
    return true;
  }

  return false;
}

function ordinalPlacement(placement: Placement) {
  if (placement === "first") {
    return "1st";
  }

  if (placement === "second") {
    return "2nd";
  }

  if (placement === "third") {
    return "3rd";
  }

  return "4th";
}

function isThirdPlaceWinnerSeed(seed: string): seed is (typeof THIRD_PLACE_WINNER_SEEDS)[number] {
  return THIRD_PLACE_WINNER_SEEDS.includes(seed as (typeof THIRD_PLACE_WINNER_SEEDS)[number]);
}

function resolveThirdPlaceSeed(
  seed: string,
  match: BracketMatchConfig,
  thirdPlaceOption?: ThirdPlaceAllocationOption
): string | undefined {
  if (!/^3[A-L]+$/.test(seed)) {
    return seed.length === 2 ? seed : undefined;
  }

  const pairedWinnerSeed = [match.left, match.right].find(isThirdPlaceWinnerSeed);

  if (!pairedWinnerSeed || !thirdPlaceOption) {
    return undefined;
  }

  return thirdPlaceOption.assignments[pairedWinnerSeed];
}

export function resolveBracketSeed(
  seed: string,
  match: BracketMatchConfig,
  placements: GroupPlacements,
  thirdPlaceOption?: ThirdPlaceAllocationOption,
  knockoutWinners: KnockoutWinners = {}
): {
  active?: boolean;
  label: string;
  seed: string;
  team?: WorldCup2026GroupTeam;
} {
  const resolvedThirdSeed = resolveThirdPlaceSeed(seed, match, thirdPlaceOption);
  const seedToResolve = resolvedThirdSeed ?? seed;
  const winnerMatch = seedToResolve.match(/^W(\d+)$/);
  const winnerTeam = winnerMatch
    ? getWorldCupTeamByIdOrCode(knockoutWinners[Number(winnerMatch[1])] ?? "")
    : undefined;

  if (winnerMatch && winnerTeam) {
    return {
      label: winnerTeam.name,
      seed: seedToResolve,
      team: winnerTeam
    };
  }

  const directSeedMatch = seedToResolve.match(/^([123])([A-L])$/);

  if (directSeedMatch) {
    const placement =
      directSeedMatch[1] === "1"
        ? "first"
        : directSeedMatch[1] === "2"
          ? "second"
          : "third";
    const group = directSeedMatch[2] as WorldCup2026Group;
    const team = getWorldCupTeamByIdOrCode(placements[group]?.[placement] ?? "");

    return {
      label: team?.name ?? `${ordinalPlacement(placement)} ${group}`,
      seed: seedToResolve,
      team
    };
  }

  if (/^3[A-L]+$/.test(seed)) {
    return {
      label: "Best third",
      seed: resolvedThirdSeed ?? seed
    };
  }

  if (/^[WL]\d+$/.test(seed)) {
    const matchId = seed.slice(1);

    return {
      label: `${seed.startsWith("W") ? "Winner" : "Loser"} M${matchId}`,
      seed
    };
  }

  return {
    label: seed,
    seed
  };
}

function resolveCandidateTeams(
  seed: string,
  match: BracketMatchConfig,
  placements: GroupPlacements,
  thirdPlaceOption: ThirdPlaceAllocationOption | undefined,
  knockoutWinners: KnockoutWinners,
  visitedMatchIds: Set<number> = new Set()
): WorldCup2026GroupTeam[] {
  const resolvedThirdSeed = resolveThirdPlaceSeed(seed, match, thirdPlaceOption);
  const seedToResolve = resolvedThirdSeed ?? seed;
  const winnerMatch = seedToResolve.match(/^W(\d+)$/);

  if (winnerMatch) {
    const sourceMatchId = Number(winnerMatch[1]);
    const selectedWinner = getWorldCupTeamByIdOrCode(
      knockoutWinners[sourceMatchId] ?? ""
    );

    if (selectedWinner) {
      return [selectedWinner];
    }

    if (visitedMatchIds.has(sourceMatchId)) {
      return [];
    }

    const sourceMatch = MATCH_LOOKUP.get(sourceMatchId);

    if (!sourceMatch) {
      return [];
    }

    visitedMatchIds.add(sourceMatchId);

    return getMatchCandidateTeams(
      sourceMatch,
      placements,
      thirdPlaceOption,
      knockoutWinners
    );
  }

  const resolved = resolveBracketSeed(
    seed,
    match,
    placements,
    thirdPlaceOption,
    knockoutWinners
  );

  return resolved.team ? [resolved.team] : [];
}

export function getSeedCandidateTeams(
  seed: string,
  match: BracketMatchConfig,
  placements: GroupPlacements,
  thirdPlaceOption: ThirdPlaceAllocationOption | undefined,
  knockoutWinners: KnockoutWinners
): WorldCup2026GroupTeam[] {
  return resolveCandidateTeams(
    seed,
    match,
    placements,
    thirdPlaceOption,
    knockoutWinners
  );
}

export function getMatchCandidateTeams(
  match: BracketMatchConfig,
  placements: GroupPlacements,
  thirdPlaceOption: ThirdPlaceAllocationOption | undefined,
  knockoutWinners: KnockoutWinners
): WorldCup2026GroupTeam[] {
  const teams = [match.left, match.right].flatMap((seed) =>
    resolveCandidateTeams(
      seed,
      match,
      placements,
      thirdPlaceOption,
      knockoutWinners
    )
  );
  const seenTeamIds = new Set<string>();

  return teams.filter((team) => {
    if (seenTeamIds.has(team.id)) {
      return false;
    }

    seenTeamIds.add(team.id);
    return true;
  });
}

export { resolveThirdPlaceOption };
