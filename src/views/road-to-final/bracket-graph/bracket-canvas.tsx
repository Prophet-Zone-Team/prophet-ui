"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import type { PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";

import {
  LEFT_BRACKET_COLUMNS,
  RIGHT_BRACKET_COLUMNS
} from "../lib/bracket-config";
import {
  translateBracketSeedLabel,
  translateColumnLabel
} from "../lib/i18n-labels";
import type {
  BracketColumnConfig,
  BracketSide,
  GroupPlacements,
  KnockoutWinners
} from "../types";
import { getSeedCandidateTeams, resolveBracketSeed } from "./bracket-resolver";
import { BracketMatchCard } from "./bracket-match-card";
import { SeedSlot } from "./seed-slot";

function CollapsedBracketSide({
  onToggle,
  side
}: {
  onToggle: () => void;
  side: Exclude<BracketSide, "center">;
}) {
  const t = useTranslations("roadToFinal");

  return (
    <button
      type="button"
      className={cn(
        "flex min-h-[200px] w-[48px] shrink-0 flex-col items-center justify-center gap-[8px]",
        "rounded-[8px] border border-dashed border-[#EBEBEB] bg-[#F9FAFC] text-[#909090]",
        "transition-colors hover:border-[#18110F] hover:text-black"
      )}
      aria-label={
        side === "left" ? t("expandLeftHalf") : t("expandRightHalf")
      }
      onClick={onToggle}
    >
      {side === "left" ? (
        <ChevronRight className="h-4 w-4" aria-hidden />
      ) : (
        <ChevronLeft className="h-4 w-4" aria-hidden />
      )}
      <span className="text-[10px] font-[300] [writing-mode:vertical-rl]">
        {side === "left" ? t("leftHalf") : t("rightHalf")}
      </span>
      <strong className="text-[11px] font-[400] text-black">{t("show")}</strong>
    </button>
  );
}

function BracketSideColumns({
  activeMatchIds,
  columns,
  knockoutWinners,
  onWinnerChange,
  placements,
  result,
  side,
  thirdPlaceOption
}: {
  activeMatchIds: Set<number>;
  columns: BracketColumnConfig[];
  knockoutWinners: KnockoutWinners;
  onWinnerChange: (matchId: number, teamId: string) => void;
  placements: GroupPlacements;
  result: PathResult;
  side: BracketSide;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}) {
  const t = useTranslations("roadToFinal");

  return (
    <>
      {columns.map((column) => (
        <div
          key={`${side}-${column.key}`}
          className="flex shrink-0 flex-col justify-center gap-[16px]"
        >
          <span className="text-center text-[10px] font-[300] text-[#909090]">
            {translateColumnLabel(column, t)}
          </span>
          <div className="flex flex-col gap-[16px]">
            {column.matchIds.map((matchId) => (
              <BracketMatchCard
                key={matchId}
                active={activeMatchIds.has(matchId)}
                activeMatchIds={activeMatchIds}
                knockoutWinners={knockoutWinners}
                matchId={matchId}
                onWinnerChange={onWinnerChange}
                placements={placements}
                result={result}
                side={side}
                thirdPlaceOption={thirdPlaceOption}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function ResolvedFinalSlot({
  active,
  knockoutWinners,
  onWinnerChange,
  placements,
  seed,
  thirdPlaceOption
}: {
  active?: boolean;
  knockoutWinners: KnockoutWinners;
  onWinnerChange: (matchId: number, teamId: string) => void;
  placements: GroupPlacements;
  seed: string;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}) {
  const t = useTranslations("roadToFinal");
  const matchId = 104;
  const match = { matchId, left: "W101", right: "W102", stage: "FINAL" };
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
    resolved.team?.id ??
    (candidates.length === 1 ? candidates[0].id : undefined);
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
        selectable ? () => onWinnerChange(matchId, candidates[0].id) : undefined
      }
      seed={resolved.seed}
      selected={selected}
      team={resolved.team}
    />
  );
}

export function BracketCanvas({
  activeMatchIds,
  collapsedSides,
  knockoutWinners,
  onToggleSide,
  onWinnerChange,
  placements,
  result,
  thirdPlaceOption,
  variant
}: {
  activeMatchIds: Set<number>;
  collapsedSides: { left: boolean; right: boolean };
  knockoutWinners: KnockoutWinners;
  onToggleSide: (side: Exclude<BracketSide, "center">) => void;
  onWinnerChange: (matchId: number, teamId: string) => void;
  placements: GroupPlacements;
  result: PathResult;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
  variant?: "fullscreen";
}) {
  const t = useTranslations("roadToFinal");
  const resultTeamName = useLocalizedTeamName(result.teamCode, result.teamName);
  const finalActive = activeMatchIds.has(104);

  return (
    <div
      className={cn(
        "overflow-x-auto overflow-y-visible",
        variant === "fullscreen" && "min-h-0 flex-1 overflow-y-auto"
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-fit min-w-max items-stretch justify-center gap-[12px] py-[8px]",
          collapsedSides.left && "pl-0",
          collapsedSides.right && "pr-0"
        )}
      >
        {collapsedSides.left ? (
          <CollapsedBracketSide
            side="left"
            onToggle={() => onToggleSide("left")}
          />
        ) : (
          <BracketSideColumns
            activeMatchIds={activeMatchIds}
            columns={LEFT_BRACKET_COLUMNS}
            knockoutWinners={knockoutWinners}
            onWinnerChange={onWinnerChange}
            placements={placements}
            result={result}
            side="left"
            thirdPlaceOption={thirdPlaceOption}
          />
        )}

        <div
          className="flex w-[160px] shrink-0 flex-col items-center gap-[8px] self-center"
          aria-label={t("final")}
        >
          <span className="text-[10px] font-[300] text-[#909090]">
            {t("final")}
          </span>
          <div className="w-full rounded-[8px] border border-[#EBEBEB] bg-white p-[12px]">
            <span className="rounded-[4px] bg-[#F3F4F6] px-[6px] py-[2px] text-[10px] text-[#909090]">
              {t("matchPrefix", { matchId: 104 })}
            </span>
            <strong className="mt-[6px] block text-[14px] font-[400] text-black">
              {t("final")}
            </strong>
            <div className="mt-[8px] flex flex-col gap-[6px]">
              <ResolvedFinalSlot
                active={activeMatchIds.has(101)}
                knockoutWinners={knockoutWinners}
                onWinnerChange={onWinnerChange}
                placements={placements}
                seed="W101"
                thirdPlaceOption={thirdPlaceOption}
              />
              <span className="text-center text-[10px] text-[#909090]">
                {t("versus")}
              </span>
              <ResolvedFinalSlot
                active={activeMatchIds.has(102)}
                knockoutWinners={knockoutWinners}
                onWinnerChange={onWinnerChange}
                placements={placements}
                seed="W102"
                thirdPlaceOption={thirdPlaceOption}
              />
            </div>
            <div className="mt-[8px] text-center text-[24px]" aria-hidden>
              🏆
            </div>
            <p className="m-0 mt-[6px] text-[10px] font-[300] text-[#909090]">
              {finalActive
                ? t("finalRouteReachesLane", { teamName: resultTeamName })
                : t("finalRoutePending")}
            </p>
          </div>
        </div>

        {collapsedSides.right ? (
          <CollapsedBracketSide
            side="right"
            onToggle={() => onToggleSide("right")}
          />
        ) : (
          <BracketSideColumns
            activeMatchIds={activeMatchIds}
            columns={RIGHT_BRACKET_COLUMNS}
            knockoutWinners={knockoutWinners}
            onWinnerChange={onWinnerChange}
            placements={placements}
            result={result}
            side="right"
            thirdPlaceOption={thirdPlaceOption}
          />
        )}
      </div>
    </div>
  );
}
