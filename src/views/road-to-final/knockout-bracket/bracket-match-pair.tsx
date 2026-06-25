"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";

import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";
import type { WorldCup2026GroupTeam } from "@/data/world-cup-2026/groups";
import { cn } from "@/lib/cn";

import { MATCH_LOOKUP } from "../lib/bracket-config";
import {
  getMatchCandidateTeams,
  getSeedCandidateTeams,
  resolveBracketSeed
} from "../lib/bracket-resolver";
import type { GroupPlacements, KnockoutWinners } from "../types";
import {
  BracketTeamChip,
  type TeamSlotVisualState
} from "./bracket-team-chip";
import {
  FINAL_MATCH_CARD_HEIGHT,
  FINAL_MATCH_CARD_WIDTH,
  INNER_MATCH_CARD_HEIGHT,
  INNER_MATCH_CARD_WIDTH,
  R32_MATCH_CARD_HEIGHT,
  R32_MATCH_CARD_WIDTH
} from "./full-bracket-layout";

function resolveSlotTeam(
  seed: string,
  matchId: number,
  placements: GroupPlacements,
  thirdPlaceOption: ThirdPlaceAllocationOption | undefined,
  knockoutWinners: KnockoutWinners
): WorldCup2026GroupTeam | undefined {
  const match = MATCH_LOOKUP.get(matchId);

  if (!match) {
    return undefined;
  }

  const resolved = resolveBracketSeed(
    seed,
    match,
    placements,
    thirdPlaceOption,
    knockoutWinners
  );

  return resolved.team;
}

function resolveSlotVisualState({
  team,
  matchId,
  selectedWinnerId,
  championTeamId,
  hasChampion,
  highlightedTeamIds
}: {
  team?: WorldCup2026GroupTeam;
  matchId: number;
  selectedWinnerId?: string;
  championTeamId?: string;
  hasChampion: boolean;
  highlightedTeamIds?: Set<string>;
}): TeamSlotVisualState {
  if (!team) {
    return "empty";
  }

  if (!selectedWinnerId) {
    return "filled";
  }

  if (team.id === selectedWinnerId) {
    if (hasChampion && matchId === 104 && team.id === championTeamId) {
      return "champion";
    }

    if (highlightedTeamIds?.has(team.id)) {
      return "pathWinner";
    }

    return "winner";
  }

  return "loser";
}

export function BracketMatchPair({
  matchId,
  placements,
  thirdPlaceOption,
  knockoutWinners,
  championTeamId,
  hasChampion,
  disabled,
  onWinnerChange,
  probabilityByTeamId,
  highlightedTeamIds,
  showValidationHint = false,
  variant = "inner",
  className,
  style
}: {
  matchId: number;
  placements: GroupPlacements;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  knockoutWinners: KnockoutWinners;
  championTeamId?: string;
  hasChampion: boolean;
  disabled?: boolean;
  onWinnerChange: (matchId: number, teamId: string) => void;
  probabilityByTeamId?: Map<string, number>;
  highlightedTeamIds?: Set<string>;
  showValidationHint?: boolean;
  variant?: "r32" | "inner" | "final";
  className?: string;
  style?: CSSProperties;
}) {
  const t = useTranslations("roadToFinal");
  const match = MATCH_LOOKUP.get(matchId);

  if (!match) {
    return null;
  }

  const selectedWinnerId = knockoutWinners[matchId];
  const leftTeam = resolveSlotTeam(
    match.left,
    matchId,
    placements,
    thirdPlaceOption,
    knockoutWinners
  );
  const rightTeam = resolveSlotTeam(
    match.right,
    matchId,
    placements,
    thirdPlaceOption,
    knockoutWinners
  );

  const leftCandidates = getSeedCandidateTeams(
    match.left,
    match,
    placements,
    thirdPlaceOption,
    knockoutWinners
  );
  const rightCandidates = getSeedCandidateTeams(
    match.right,
    match,
    placements,
    thirdPlaceOption,
    knockoutWinners
  );
  const matchReady =
    getMatchCandidateTeams(
      match,
      placements,
      thirdPlaceOption,
      knockoutWinners
    ).length >= 2;

  const isFinal = variant === "final";
  const chipVariant = isFinal ? "final" : "inner";
  const cardWidth = isFinal
    ? FINAL_MATCH_CARD_WIDTH
    : variant === "r32"
      ? R32_MATCH_CARD_WIDTH
      : INNER_MATCH_CARD_WIDTH;
  const cardHeight = isFinal
    ? FINAL_MATCH_CARD_HEIGHT
    : variant === "r32"
      ? R32_MATCH_CARD_HEIGHT
      : INNER_MATCH_CARD_HEIGHT;

  const renderSlot = (
    team: WorldCup2026GroupTeam | undefined,
    candidates: WorldCup2026GroupTeam[]
  ) => {
    const visualState = resolveSlotVisualState({
      team,
      matchId,
      selectedWinnerId,
      championTeamId,
      hasChampion,
      highlightedTeamIds
    });
    const canSelect =
      !disabled &&
      matchReady &&
      team &&
      candidates.some((candidate) => candidate.id === team.id);

    return (
      <BracketTeamChip
        team={team}
        visualState={visualState}
        disabled={!canSelect}
        variant={chipVariant}
        probabilityByTeamId={probabilityByTeamId}
        onSelect={
          canSelect
            ? () => onWinnerChange(matchId, team.id)
            : undefined
        }
      />
    );
  };

  return (
    <div className="absolute" style={style}>
      <article
        className={cn(
          "flex flex-row items-stretch overflow-hidden rounded-[12px] border border-[#33375A] bg-[rgba(50,57,66,0.5)] backdrop-blur-[5px]",
          isFinal ? "p-[5px]" : "p-[4px]",
          className
        )}
        style={{ width: cardWidth, height: cardHeight }}
        aria-label={`Match ${matchId}`}
        aria-invalid={showValidationHint}
      >
        {renderSlot(leftTeam, leftCandidates)}
        {renderSlot(rightTeam, rightCandidates)}
      </article>
      {showValidationHint ? (
        <span
          className={cn(
            "absolute left-0 top-full mt-[4px] w-full text-center",
            "whitespace-nowrap text-[11px] leading-tight text-[#FF674B]"
          )}
        >
          {t("selectAtLeastOne")}
        </span>
      ) : null}
    </div>
  );
}
