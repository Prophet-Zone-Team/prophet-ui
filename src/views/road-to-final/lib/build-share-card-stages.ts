import { getWorldCupGroupForTeam } from "@/data/world-cup-2026/groups";
import {
  getWorldCupTeamByIdOrCode,
  type WorldCup2026Group,
} from "@/data/world-cup-2026/groups";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type { KnockoutRound, PathResult } from "@/types/market";

import { getMatchCandidateTeams } from "./bracket-resolver";
import { MATCH_LOOKUP } from "./bracket-config";
import { buildChampionPathHighlight } from "./champion-path";
import { safeCalculatePath } from "./calculate-path";
import { ROUND_LABELS } from "./format";
import { getFinishForTeam } from "./placements";
import type { GroupPlacements, KnockoutWinners, Placement } from "../types";

export type ShareCardTeam = {
  id: string;
  name: string;
  code: string;
};

export type ShareCardStageKey =
  | "FINAL"
  | "QF"
  | "R32"
  | "SF"
  | "R16"
  | "GROUP";

export type ShareCardStage = {
  key: ShareCardStageKey;
  side: "left" | "right";
  label: string;
  focusTeam: ShareCardTeam;
  opponents: ShareCardTeam[];
};

const STAGE_LAYOUT: Array<{
  key: ShareCardStageKey;
  side: "left" | "right";
  round?: KnockoutRound;
}> = [
  { key: "FINAL", side: "left", round: "FINAL" },
  { key: "SF", side: "right", round: "SF" },
  { key: "QF", side: "left", round: "QF" },
  { key: "R16", side: "right", round: "R16" },
  { key: "R32", side: "left", round: "R32" },
  { key: "GROUP", side: "right" },
];

const GROUP_PLACEMENT_ORDER: Placement[] = [
  "first",
  "second",
  "third",
  "fourth",
];

function toShareCardTeam(teamId: string): ShareCardTeam | null {
  const team = getWorldCupTeamByIdOrCode(teamId);

  if (!team) {
    return null;
  }

  return {
    id: team.id,
    name: team.name,
    code: team.code,
  };
}

function resolveKnockoutRound(matchId: number): KnockoutRound | undefined {
  const stage = MATCH_LOOKUP.get(matchId)?.stage;

  if (stage === "R32") {
    return "R32";
  }

  if (stage === "R16") {
    return "R16";
  }

  if (stage === "QF") {
    return "QF";
  }

  if (stage === "SF") {
    return "SF";
  }

  if (stage === "FINAL") {
    return "FINAL";
  }

  return undefined;
}

function resolveChampionPathMatchIds(
  knockoutWinners: KnockoutWinners,
  championTeamId: string
): Partial<Record<KnockoutRound, number>> {
  const { highlightedMatchIds } = buildChampionPathHighlight(
    knockoutWinners,
    championTeamId
  );
  const matches: Partial<Record<KnockoutRound, number>> = {};

  for (const matchId of highlightedMatchIds) {
    const round = resolveKnockoutRound(matchId);

    if (round) {
      matches[round] = matchId;
    }
  }

  return matches;
}

function resolvePathMatchId(
  result: PathResult,
  round: KnockoutRound,
): number | undefined {
  const roundSummary = result.rounds.find((item) => item.round === round);

  if (!roundSummary) {
    return undefined;
  }

  return (
    roundSummary.matchIds.find((matchId) =>
      result.pathMatchIds.includes(matchId),
    ) ?? roundSummary.matchIds[0]
  );
}

function resolveKnockoutOpponent({
  focusTeamId,
  matchId,
  placements,
  thirdPlaceOption,
  knockoutWinners,
}: {
  focusTeamId: string;
  matchId: number;
  placements: GroupPlacements;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  knockoutWinners: KnockoutWinners;
}): ShareCardTeam | null {
  const match = MATCH_LOOKUP.get(matchId);

  if (!match) {
    return null;
  }

  const candidates = getMatchCandidateTeams(
    match,
    placements,
    thirdPlaceOption,
    knockoutWinners,
  );
  const opponent = candidates.find((team) => team.id !== focusTeamId);

  return opponent ? toShareCardTeam(opponent.id) : null;
}

function buildGroupStage(
  focusTeam: ShareCardTeam,
  group: string,
  placements: GroupPlacements,
): ShareCardStage {
  const groupKey = group as WorldCup2026Group;
  const opponents = GROUP_PLACEMENT_ORDER.flatMap((placement) => {
    const teamId = placements[groupKey]?.[placement];
    const team = teamId ? toShareCardTeam(teamId) : null;
    return team ? [team] : [];
  });

  return {
    key: "GROUP",
    side: "right",
    label: `GROUP ${group}`,
    focusTeam,
    opponents,
  };
}

export function buildShareCardStages({
  teamId,
  result,
  placements,
  knockoutWinners,
  thirdPlaceOption,
}: {
  teamId: string;
  result?: PathResult;
  placements: GroupPlacements;
  knockoutWinners: KnockoutWinners;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}): ShareCardStage[] {
  const focusTeam = toShareCardTeam(teamId);

  if (!focusTeam) {
    return [];
  }

  const championPathMatches = resolveChampionPathMatchIds(
    knockoutWinners,
    focusTeam.id
  );
  const group =
    result?.group ?? getWorldCupGroupForTeam(focusTeam.id) ?? "A";

  return STAGE_LAYOUT.map((layout) => {
    if (layout.key === "GROUP") {
      return buildGroupStage(focusTeam, group, placements);
    }

    const round = layout.round;

    if (!round) {
      return {
        key: layout.key,
        side: layout.side,
        label: ROUND_LABELS[layout.key as KnockoutRound].toUpperCase(),
        focusTeam,
        opponents: [],
      };
    }

    const matchId =
      championPathMatches[round] ??
      (result ? resolvePathMatchId(result, round) : undefined);
    const opponent =
      matchId !== undefined
        ? resolveKnockoutOpponent({
            focusTeamId: focusTeam.id,
            matchId,
            placements,
            thirdPlaceOption,
            knockoutWinners,
          })
        : null;

    return {
      key: layout.key,
      side: layout.side,
      label: ROUND_LABELS[round].toUpperCase(),
      focusTeam,
      opponents: opponent ? [opponent] : [],
    };
  });
}

export function buildShareCardChampion(
  championTeamId?: string,
): ShareCardTeam | null {
  if (!championTeamId) {
    return null;
  }

  return toShareCardTeam(championTeamId);
}

export function resolveShareCardPathResult({
  teamId,
  championTeamId,
  result,
  placements,
  advancingThirdGroups,
}: {
  teamId: string;
  championTeamId?: string;
  result?: PathResult;
  placements: GroupPlacements;
  advancingThirdGroups: string[];
}): { simulationTeamId: string; simulationResult?: PathResult } {
  const simulationTeamId = championTeamId ?? teamId;

  if (!result) {
    return { simulationTeamId, simulationResult: undefined };
  }

  if (simulationTeamId === result.teamId) {
    return { simulationTeamId, simulationResult: result };
  }

  const finishType = getFinishForTeam(placements, simulationTeamId);

  if (!finishType) {
    return { simulationTeamId, simulationResult: result };
  }

  const calculation = safeCalculatePath({
    teamId: simulationTeamId,
    finishType,
    thirdGroups: advancingThirdGroups,
    placements,
  });

  return {
    simulationTeamId,
    simulationResult: calculation.result ?? result,
  };
}
