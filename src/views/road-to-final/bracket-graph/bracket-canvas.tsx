import { ChevronLeft, ChevronRight } from "lucide-react";

import { getWorldCupTeamByIdOrCode } from "@/data/world-cup-2026/groups";
import { cn } from "@/lib/cn";
import type { PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";

import {
  LEFT_BRACKET_COLUMNS,
  MATCH_LOOKUP,
  RIGHT_BRACKET_COLUMNS
} from "../lib/bracket-config";
import type {
  BracketColumnConfig,
  BracketSide,
  GroupPlacements,
  KnockoutWinners
} from "../types";
import {
  getMatchCandidateTeams,
  isActiveSlot,
  resolveBracketSeed
} from "./bracket-resolver";
import { BracketMatchCard } from "./bracket-match-card";
import { SeedSlot } from "./seed-slot";
import { WinnerSelect } from "./winner-select";

function CollapsedBracketSide({
  onToggle,
  side
}: {
  onToggle: () => void;
  side: Exclude<BracketSide, "center">;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-[200px] w-[48px] shrink-0 flex-col items-center justify-center gap-[8px]",
        "rounded-[8px] border border-dashed border-[#EBEBEB] bg-[#F9FAFC] text-[#909090]",
        "transition-colors hover:border-[#18110F] hover:text-black"
      )}
      aria-label={`Expand ${side} half`}
      onClick={onToggle}
    >
      {side === "left" ? (
        <ChevronRight className="h-4 w-4" aria-hidden />
      ) : (
        <ChevronLeft className="h-4 w-4" aria-hidden />
      )}
      <span className="text-[10px] font-[300] [writing-mode:vertical-rl]">
        {side === "left" ? "Left half" : "Right half"}
      </span>
      <strong className="text-[11px] font-[400] text-black">Show</strong>
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
  return (
    <>
      {columns.map((column) => (
        <div
          key={`${side}-${column.key}`}
          className="flex shrink-0 flex-col gap-[8px]"
        >
          <span className="text-center text-[10px] font-[300] text-[#909090]">
            {column.label}
          </span>
          <div className="flex flex-col gap-[10px]">
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
  placements,
  seed,
  thirdPlaceOption
}: {
  active?: boolean;
  knockoutWinners: KnockoutWinners;
  placements: GroupPlacements;
  seed: string;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}) {
  const match = { matchId: 104, left: "W101", right: "W102", stage: "FINAL" };
  const resolved = resolveBracketSeed(
    seed,
    match,
    placements,
    thirdPlaceOption,
    knockoutWinners
  );

  return (
    <SeedSlot
      active={active || resolved.active}
      label={resolved.label}
      seed={resolved.seed}
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
  const finalActive = activeMatchIds.has(104);
  const finalMatch = MATCH_LOOKUP.get(104) ?? {
    matchId: 104,
    left: "W101",
    right: "W102"
  };
  const finalCandidates = getMatchCandidateTeams(
    finalMatch,
    placements,
    thirdPlaceOption,
    knockoutWinners
  );

  return (
    <div
      className={cn(
        "overflow-x-auto overflow-y-visible",
        variant === "fullscreen" && "min-h-0 flex-1 overflow-y-auto"
      )}
    >
      <div
        className={cn(
          "flex min-w-max items-stretch gap-[12px] py-[8px]",
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
          aria-label="Final"
        >
          <span className="text-[10px] font-[300] text-[#909090]">Final</span>
          <div
            className={cn(
              "w-full rounded-[8px] border p-[12px]",
              finalActive
                ? "border-[#18110F] bg-[#F9FAFC]"
                : "border-[#EBEBEB] bg-white"
            )}
          >
            <span className="rounded-[4px] bg-[#F3F4F6] px-[6px] py-[2px] text-[10px] text-[#909090]">
              M104
            </span>
            <strong className="mt-[6px] block text-[14px] font-[400] text-black">
              Final
            </strong>
            <div className="mt-[8px] flex flex-col gap-[6px]">
              <ResolvedFinalSlot
                active={activeMatchIds.has(101)}
                knockoutWinners={knockoutWinners}
                placements={placements}
                seed="W101"
                thirdPlaceOption={thirdPlaceOption}
              />
              <span className="text-center text-[10px] text-[#909090]">vs</span>
              <ResolvedFinalSlot
                active={activeMatchIds.has(102)}
                knockoutWinners={knockoutWinners}
                placements={placements}
                seed="W102"
                thirdPlaceOption={thirdPlaceOption}
              />
            </div>
            <WinnerSelect
              label="Champion"
              matchId={104}
              onWinnerChange={onWinnerChange}
              options={finalCandidates}
              value={knockoutWinners[104] ?? ""}
            />
            <div className="mt-[8px] text-center text-[24px]" aria-hidden>
              🏆
            </div>
            <p className="m-0 mt-[6px] text-[10px] font-[300] text-[#909090]">
              {finalActive
                ? `${result.teamName} route reaches the final lane.`
                : "Projected winner path appears once a finalist branch is selected."}
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
