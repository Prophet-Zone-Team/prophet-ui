"use client";

import { useTranslations } from "next-intl";

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import type { PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";

import { MATCH_LOOKUP } from "../lib/bracket-config";
import {
  translateBracketSeedLabel,
  translateRoundLabel
} from "../lib/i18n-labels";
import type {
  BracketSide,
  GroupPlacements,
  KnockoutWinners
} from "../types";
import {
  getMatchStage,
  getSeedCandidateTeams,
  isActiveSlot,
  resolveBracketSeed
} from "./bracket-resolver";
import { SeedSlot } from "./seed-slot";

function ResolvedSeedSlot({
  active,
  knockoutWinners,
  match,
  matchId,
  onWinnerChange,
  placements,
  seed,
  thirdPlaceOption
}: {
  active?: boolean;
  knockoutWinners: KnockoutWinners;
  match: { matchId: number; left: string; right: string };
  matchId: number;
  onWinnerChange: (matchId: number, teamId: string) => void;
  placements: GroupPlacements;
  seed: string;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}) {
  const t = useTranslations("roadToFinal");
  const resolved = resolveBracketSeed(
    seed,
    match,
    placements,
    thirdPlaceOption,
    knockoutWinners
  );
  const candidates = getSeedCandidateTeams(
    seed,
    match,
    placements,
    thirdPlaceOption,
    knockoutWinners
  );
  const selectedWinnerId = knockoutWinners[matchId];
  const slotTeamId =
    resolved.team?.id ?? (candidates.length === 1 ? candidates[0].id : undefined);
  const selected = Boolean(
    selectedWinnerId && slotTeamId && selectedWinnerId === slotTeamId
  );
  const selectable = candidates.length === 1;
  const localizedTeamName = useLocalizedTeamName(
    resolved.team?.code ?? "",
    resolved.team?.name ?? ""
  );
  const label = resolved.team
    ? localizedTeamName
    : translateBracketSeedLabel(resolved.label, resolved.seed, t);

  return (
    <SeedSlot
      active={active || resolved.active}
      disabled={!selectable}
      label={label}
      onClick={
        selectable
          ? () => onWinnerChange(matchId, candidates[0].id)
          : undefined
      }
      seed={resolved.seed}
      selected={selected}
      team={resolved.team}
    />
  );
}

export function BracketMatchCard({
  active,
  activeMatchIds,
  knockoutWinners,
  matchId,
  onWinnerChange,
  placements,
  result,
  side,
  thirdPlaceOption
}: {
  active: boolean;
  activeMatchIds: Set<number>;
  knockoutWinners: KnockoutWinners;
  matchId: number;
  onWinnerChange: (matchId: number, teamId: string) => void;
  placements: GroupPlacements;
  result: PathResult;
  side: BracketSide;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}) {
  const t = useTranslations("roadToFinal");
  const resultTeamName = useLocalizedTeamName(result.teamCode, result.teamName);
  const match = MATCH_LOOKUP.get(matchId);
  const stage = getMatchStage(match);

  if (!match) {
    return null;
  }

  return (
    <article
      className={cn(
        "min-w-[140px] rounded-[8px] border border-[#EBEBEB] bg-white p-[10px]",
        side === "left" ? "mr-[8px]" : "ml-[8px]"
      )}
      aria-label={t("matchLabel", { matchId })}
    >
      <div className="mb-[8px] flex items-center justify-between gap-[6px]">
        <span className="rounded-[4px] bg-[#F3F4F6] px-[6px] py-[2px] text-[10px] font-[300] text-[#909090]">
          {t("matchPrefix", { matchId })}
        </span>
        <span className="text-[10px] font-[300] text-[#909090]">
          {stage ? translateRoundLabel(stage, t) : t("knockoutShort")}
        </span>
      </div>
      <div className="flex flex-col gap-[6px]">
        <ResolvedSeedSlot
          active={isActiveSlot(match.left, activeMatchIds, result)}
          knockoutWinners={knockoutWinners}
          match={match}
          matchId={matchId}
          onWinnerChange={onWinnerChange}
          placements={placements}
          seed={match.left}
          thirdPlaceOption={thirdPlaceOption}
        />
        <ResolvedSeedSlot
          active={isActiveSlot(match.right, activeMatchIds, result)}
          knockoutWinners={knockoutWinners}
          match={match}
          matchId={matchId}
          onWinnerChange={onWinnerChange}
          placements={placements}
          seed={match.right}
          thirdPlaceOption={thirdPlaceOption}
        />
      </div>
      {active ? (
        <p className="m-0 mt-[6px] text-[10px] font-[300] text-[#909090]">
          {t("teamPath", { teamName: resultTeamName })}
        </p>
      ) : null}
    </article>
  );
}
