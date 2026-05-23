import { KNOCKOUT_LINKS } from "@/data/world-cup-2026/knockout-links";
import { ROUND_OF_32 } from "@/data/world-cup-2026/round-of-32";
import { THIRD_PLACE_ALLOCATION_OPTIONS, type ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import {
  WORLD_CUP_2026_GROUPS,
  WORLD_CUP_2026_GROUP_ORDER,
  getAllWorldCup2026Teams,
  getWorldCupGroupForTeam,
  getWorldCupTeamByIdOrCode,
  type WorldCup2026Group,
} from "@/data/world-cup-2026/groups";
import type {
  FinishType,
  KnockoutRound,
  OpponentPossibility,
  PathQuery,
  PathResult,
  PathScenarioResolution,
  RoundOpponentSummary,
  Team,
} from "@/types/market";

interface BracketMatch {
  matchId: number;
  left: string;
  right: string;
}

interface TargetBranch {
  matchId: number;
  targetNode: string;
  siblingNode: string;
}

interface PathCalculationContext {
  allocationOptions: ThirdPlaceAllocationOption[];
  scenario: PathScenarioResolution;
}

const ROUND_ORDER: KnockoutRound[] = ["R32", "R16", "QF", "SF", "FINAL"];
const THIRD_PLACE_WINNER_SEEDS = ["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"] as const;
const MATCHES: BracketMatch[] = [...ROUND_OF_32, ...KNOCKOUT_LINKS];
const matchesById = new Map(MATCHES.map((match) => [match.matchId, match]));

export function calculateWorldCupPath(query: PathQuery): PathResult {
  const team = getWorldCupTeamByIdOrCode(query.teamId);
  const group = getWorldCupGroupForTeam(query.teamId);

  if (!team || !group) {
    throw new Error(`Unknown World Cup 2026 team: ${query.teamId}`);
  }

  const seed = getSeedForFinish(group, query.finishType);
  const context = buildCalculationContext(query);
  const startingBranches = findStartingBranches(seed, context);

  if (startingBranches.length === 0) {
    throw new Error(
      query.mode === "SCENARIO" && seed.startsWith("3")
        ? `Seed ${seed} is not available in this third-place scenario. Select Group ${group} as one of the advancing third-place teams.`
        : `Unable to place seed ${seed} in the official Round of 32 bracket.`,
    );
  }

  const branchesByRound = new Map<KnockoutRound, TargetBranch[]>();

  for (const branch of startingBranches) {
    for (const pathBranch of buildTargetPath(branch)) {
      const round = getRoundForMatch(pathBranch.matchId);

      if (!round) {
        continue;
      }

      branchesByRound.set(round, [...(branchesByRound.get(round) ?? []), pathBranch]);
    }
  }

  const rounds = ROUND_ORDER.map((round) => buildRoundSummary(round, branchesByRound.get(round) ?? [], team.id, context));
  const earliestPossibleMeetingMap = buildEarliestMeetingMap(rounds, team.id);
  const neverMeetTeamIds = getAllWorldCup2026Teams()
    .map((item) => item.id)
    .filter((teamId) => teamId !== team.id && earliestPossibleMeetingMap[teamId] === null);
  const pathMatchIds = unique(
    ROUND_ORDER.flatMap((round) => (branchesByRound.get(round) ?? []).map((branch) => branch.matchId)),
  ).sort((a, b) => a - b);

  return {
    teamId: team.id,
    teamCode: team.code,
    teamName: team.name,
    group,
    seed,
    finishType: query.finishType,
    mode: query.mode,
    scenario: context.scenario,
    rounds,
    earliestPossibleMeetingMap,
    neverMeetTeamIds,
    pathMatchIds,
  };
}

export function getSeedForFinish(group: WorldCup2026Group, finishType: FinishType): string {
  switch (finishType) {
    case "GROUP_WINNER":
      return `1${group}`;
    case "RUNNER_UP":
      return `2${group}`;
    case "BEST_THIRD":
      return `3${group}`;
  }
}

function buildCalculationContext(query: PathQuery): PathCalculationContext {
  if (query.mode !== "SCENARIO") {
    return {
      allocationOptions: THIRD_PLACE_ALLOCATION_OPTIONS,
      scenario: {
        status: "general",
        qualifiedThirdGroups: [],
        allocationOptionIds: THIRD_PLACE_ALLOCATION_OPTIONS.map((option) => option.option),
        assignments: buildAssignmentSummary(THIRD_PLACE_ALLOCATION_OPTIONS),
      },
    };
  }

  const qualifiedThirdGroups = normalizeQualifiedThirdGroups(query.scenario?.qualifiedThirdGroups ?? []);
  const allocationOptions = THIRD_PLACE_ALLOCATION_OPTIONS.filter((option) =>
    sameGroups(option.qualifiedThirdGroups, qualifiedThirdGroups),
  );

  if (qualifiedThirdGroups.length !== 8) {
    throw new Error("SCENARIO mode requires exactly eight advancing third-place groups.");
  }

  if (allocationOptions.length === 0) {
    throw new Error(`No Annexe C allocation option matches third-place groups ${qualifiedThirdGroups.join(", ")}.`);
  }

  return {
    allocationOptions,
    scenario: {
      status: "resolved",
      qualifiedThirdGroups,
      allocationOptionIds: allocationOptions.map((option) => option.option),
      assignments: buildAssignmentSummary(allocationOptions),
      exactAssignments: allocationOptions.length === 1 ? allocationOptions[0]?.assignments : undefined,
    },
  };
}

function findStartingBranches(seed: string, context: PathCalculationContext): TargetBranch[] {
  return ROUND_OF_32.flatMap((match) => {
    if (nodeCanContainSeed(match.left, seed, match.right, context)) {
      return [{ matchId: match.matchId, targetNode: match.left, siblingNode: match.right }];
    }

    if (nodeCanContainSeed(match.right, seed, match.left, context)) {
      return [{ matchId: match.matchId, targetNode: match.right, siblingNode: match.left }];
    }

    return [];
  });
}

function buildTargetPath(start: TargetBranch): TargetBranch[] {
  const path = [start];
  let previousMatchId = start.matchId;

  while (previousMatchId !== 104) {
    const parent = MATCHES.find((match) => match.left === `W${previousMatchId}` || match.right === `W${previousMatchId}`);

    if (!parent) {
      break;
    }

    const targetNode = `W${previousMatchId}`;
    const siblingNode = parent.left === targetNode ? parent.right : parent.left;
    path.push({
      matchId: parent.matchId,
      targetNode,
      siblingNode,
    });
    previousMatchId = parent.matchId;
  }

  return path;
}

function buildRoundSummary(
  round: KnockoutRound,
  branches: TargetBranch[],
  targetTeamId: Team["id"],
  context: PathCalculationContext,
): RoundOpponentSummary {
  const possibleOpponentTeamIds = unique(
    branches.flatMap((branch) => collectPossibleTeamIds(branch.siblingNode, branch.targetNode, targetTeamId, context)),
  ).sort();
  const possibleOpponentTeams = possibleOpponentTeamIds.map((teamId) =>
    buildOpponentPossibility(teamId, round),
  );
  const allOtherTeamIds = getAllWorldCup2026Teams()
    .map((team) => team.id)
    .filter((teamId) => teamId !== targetTeamId);

  return {
    round,
    matchIds: unique(branches.map((branch) => branch.matchId)).sort((a, b) => a - b),
    possibleOpponentTeamIds,
    possibleOpponentTeams,
    impossibleOpponentTeamIds: allOtherTeamIds.filter((teamId) => !possibleOpponentTeamIds.includes(teamId)),
  };
}

function buildOpponentPossibility(teamId: string, round: KnockoutRound): OpponentPossibility {
  const team = getWorldCupTeamByIdOrCode(teamId);

  return {
    teamId,
    teamName: team?.name ?? teamId,
    zhName: team?.zhName,
    possibleRounds: [round],
    earliestRound: round,
  };
}

function buildEarliestMeetingMap(rounds: RoundOpponentSummary[], targetTeamId: Team["id"]): Record<string, KnockoutRound | null> {
  const result = Object.fromEntries(
    getAllWorldCup2026Teams()
      .filter((team) => team.id !== targetTeamId)
      .map((team) => [team.id, null]),
  ) as Record<string, KnockoutRound | null>;

  for (const round of rounds) {
    for (const teamId of round.possibleOpponentTeamIds) {
      if (teamId !== targetTeamId && result[teamId] === null) {
        result[teamId] = round.round;
      }
    }
  }

  return result;
}

function collectPossibleTeamIds(
  node: string,
  siblingNode: string | undefined,
  targetTeamId: Team["id"],
  context: PathCalculationContext,
): Team["id"][] {
  if (node.startsWith("W")) {
    const match = matchesById.get(Number(node.slice(1)));
    return match
      ? [
          ...collectPossibleTeamIds(match.left, match.right, targetTeamId, context),
          ...collectPossibleTeamIds(match.right, match.left, targetTeamId, context),
        ]
      : [];
  }

  if (/^[123][A-L]/.test(node)) {
    const seeds = expandSeedNode(node, siblingNode, context);
    return unique(
      seeds.flatMap((seed) => {
        const group = seed.slice(1) as WorldCup2026Group;
        return WORLD_CUP_2026_GROUPS[group]?.map((team) => team.id).filter((teamId) => teamId !== targetTeamId) ?? [];
      }),
    );
  }

  return [];
}

function expandSeedNode(node: string, siblingNode: string | undefined, context: PathCalculationContext): string[] {
  if (/^[12][A-L]$/.test(node)) {
    return [node];
  }

  if (/^3[A-L]$/.test(node)) {
    return [node];
  }

  if (!node.startsWith("3")) {
    return [];
  }

  const candidateGroups = new Set(node.slice(1).split(""));
  const winnerSeed = getThirdPlaceWinnerSeed(siblingNode);
  const assignments = winnerSeed
    ? context.allocationOptions.map((option) => option.assignments[winnerSeed]).filter(Boolean)
    : [];
  const assignedSeeds = assignments.filter((seed) => candidateGroups.has(seed.slice(1)));

  return unique(assignedSeeds.length > 0 ? assignedSeeds : [...candidateGroups].map((group) => `3${group}`));
}

function nodeCanContainSeed(node: string, seed: string, siblingNode: string | undefined, context: PathCalculationContext): boolean {
  if (node === seed) {
    return true;
  }

  if (seed.startsWith("3") && node.startsWith("3")) {
    return expandSeedNode(node, siblingNode, context).includes(seed);
  }

  return false;
}

function getThirdPlaceWinnerSeed(node: string | undefined): (typeof THIRD_PLACE_WINNER_SEEDS)[number] | undefined {
  return THIRD_PLACE_WINNER_SEEDS.find((seed) => seed === node);
}

function getRoundForMatch(matchId: number): KnockoutRound | undefined {
  if (matchId >= 73 && matchId <= 88) {
    return "R32";
  }

  if (matchId >= 89 && matchId <= 96) {
    return "R16";
  }

  if (matchId >= 97 && matchId <= 100) {
    return "QF";
  }

  if (matchId === 101 || matchId === 102) {
    return "SF";
  }

  if (matchId === 104) {
    return "FINAL";
  }

  return undefined;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function normalizeQualifiedThirdGroups(groups: string[]): string[] {
  return unique(groups.map((group) => group.trim().toUpperCase()).filter((group) => WORLD_CUP_2026_GROUP_ORDER.includes(group as WorldCup2026Group))).sort();
}

function sameGroups(left: string[], right: string[]): boolean {
  const normalizedLeft = normalizeQualifiedThirdGroups(left);
  const normalizedRight = normalizeQualifiedThirdGroups(right);

  return normalizedLeft.length === normalizedRight.length && normalizedLeft.every((group, index) => group === normalizedRight[index]);
}

function buildAssignmentSummary(options: ThirdPlaceAllocationOption[]): Record<string, string[]> {
  return Object.fromEntries(
    THIRD_PLACE_WINNER_SEEDS.map((winnerSeed) => [
      winnerSeed,
      unique(options.map((option) => option.assignments[winnerSeed]).filter(Boolean)).sort(),
    ]),
  );
}
