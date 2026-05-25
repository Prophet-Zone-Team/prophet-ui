import { cn } from "@/lib/cn";
import type { PathResult } from "@/types/market";
import type { ThirdPlaceAllocationOption } from "@/data/world-cup-2026/third-place-options";

import { MATCH_LOOKUP } from "../lib/bracket-config";
import type {
  BracketSide,
  GroupPlacements,
  KnockoutWinners
} from "../types";
import {
  getMatchCandidateTeams,
  getMatchStage,
  isActiveSlot,
  resolveBracketSeed
} from "./bracket-resolver";
import { SHORT_ROUND_LABELS } from "../lib/format";
import { SeedSlot } from "./seed-slot";
import { WinnerSelect } from "./winner-select";

function ResolvedSeedSlot({
  active,
  knockoutWinners,
  match,
  placements,
  seed,
  thirdPlaceOption
}: {
  active?: boolean;
  knockoutWinners: KnockoutWinners;
  match: { matchId: number; left: string; right: string };
  placements: GroupPlacements;
  seed: string;
  thirdPlaceOption?: ThirdPlaceAllocationOption;
}) {
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
  const match = MATCH_LOOKUP.get(matchId);
  const stage = getMatchStage(match);
  const candidates = match
    ? getMatchCandidateTeams(
        match,
        placements,
        thirdPlaceOption,
        knockoutWinners
      )
    : [];

  if (!match) {
    return null;
  }

  return (
    <article
      className={cn(
        "min-w-[140px] rounded-[8px] border p-[10px]",
        active
          ? "border-[#18110F] bg-[#F9FAFC]"
          : "border-[#EBEBEB] bg-white",
        side === "left" ? "mr-[8px]" : "ml-[8px]"
      )}
      aria-label={`Match ${matchId}`}
    >
      <div className="mb-[8px] flex items-center justify-between gap-[6px]">
        <span className="rounded-[4px] bg-[#F3F4F6] px-[6px] py-[2px] text-[10px] font-[300] text-[#909090]">
          M{matchId}
        </span>
        <span className="text-[10px] font-[300] text-[#909090]">
          {stage ? SHORT_ROUND_LABELS[stage] : "KO"}
        </span>
      </div>
      <div className="flex flex-col gap-[6px]">
        <ResolvedSeedSlot
          active={isActiveSlot(match.left, activeMatchIds, result)}
          knockoutWinners={knockoutWinners}
          match={match}
          placements={placements}
          seed={match.left}
          thirdPlaceOption={thirdPlaceOption}
        />
        <ResolvedSeedSlot
          active={isActiveSlot(match.right, activeMatchIds, result)}
          knockoutWinners={knockoutWinners}
          match={match}
          placements={placements}
          seed={match.right}
          thirdPlaceOption={thirdPlaceOption}
        />
      </div>
      <WinnerSelect
        label={matchId === 104 ? "Champion" : "Winner"}
        matchId={matchId}
        onWinnerChange={onWinnerChange}
        options={candidates}
        value={knockoutWinners[matchId] ?? ""}
      />
      {active ? (
        <p className="m-0 mt-[6px] text-[10px] font-[300] text-[#909090]">
          {result.teamName} path
        </p>
      ) : null}
    </article>
  );
}
