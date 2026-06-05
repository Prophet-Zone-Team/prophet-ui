import {
  getWorldCupTeamByIdOrCode,
  type WorldCup2026Group,
} from "@/data/world-cup-2026/groups";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type { KnockoutRound, PathResult } from "@/types/market";

import { getMatchCandidateTeams } from "../bracket-graph/bracket-resolver";
import { MATCH_LOOKUP } from "./bracket-config";
import { ROUND_LABELS } from "./format";
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
  { key: "QF", side: "left", round: "QF" },
  { key: "R32", side: "left", round: "R32" },
  { key: "SF", side: "right", round: "SF" },
  { key: "R16", side: "right", round: "R16" },
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
  result: PathResult;
  placements: GroupPlacements;
  knockoutWinners: KnockoutWinners;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}): ShareCardStage[] {
  const focusTeam = toShareCardTeam(teamId);

  if (!focusTeam) {
    return [];
  }

  return STAGE_LAYOUT.map((layout) => {
    if (layout.key === "GROUP") {
      return buildGroupStage(focusTeam, result.group, placements);
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

    const matchId = resolvePathMatchId(result, round);
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
