import { cn } from "@/lib/cn";

import { formatMatchHistoryDate, formatMatchScore } from "./format";
import { matchHistoryTableGridClass } from "./table-grid";
import type { MatchHistoryEntry } from "./types";

export type MatchHistoryRowProps = {
  entry: MatchHistoryEntry;
  highlighted?: boolean;
  tall?: boolean;
};

function MatchHistoryResult({ entry }: { entry: MatchHistoryEntry }) {
  if (entry.result === "win") {
    return (
      <span className="text-[14px] leading-[17px] text-[#65AF14]">Win</span>
    );
  }

  if (entry.result === "lose") {
    return (
      <span className="text-[14px] leading-[17px] text-[#FF674B]">Lose</span>
    );
  }

  if (entry.result === "lost-penalties") {
    return (
      <div className="flex flex-col gap-[2px]">
        <span className="text-[14px] leading-[17px] text-[#909090]">Draw</span>
        <span className="text-[14px] leading-[17px] text-[#FF674B]">
          Lost on Penalties
        </span>
      </div>
    );
  }

  return (
    <span className="text-[14px] font-[457] leading-[17px] text-[#909090]">
      Draw
    </span>
  );
}

export function MatchHistoryRow({
  entry,
  highlighted = false,
  tall = false
}: MatchHistoryRowProps) {
  const hasPenaltyDetail = Boolean(entry.penaltyScore);

  return (
    <div
      role="row"
      className={cn(
        matchHistoryTableGridClass,
        "items-center rounded-[6px] text-[12px] font-[400] leading-[17px] text-black",
        highlighted ? "bg-[#F9FAFC]" : "bg-white",
        tall || hasPenaltyDetail
          ? "min-h-[66px] py-[8px]"
          : "min-h-[33px] py-[8px]"
      )}
    >
      <span role="cell" className="whitespace-nowrap">
        {formatMatchHistoryDate(entry.playedAt)}
      </span>
      <span role="cell" className="min-w-0 truncate">
        {entry.format}
      </span>
      <span role="cell">{entry.homeCode}</span>
      <div role="cell" className="flex flex-col items-center text-center">
        <span>{formatMatchScore(entry.homeScore, entry.awayScore)}</span>
        {entry.penaltyScore ? (
          <span className="mt-[2px] whitespace-nowrap text-[12px] font-[400] leading-[17px] text-black">
            {entry.penaltyScore} penalties
          </span>
        ) : null}
      </div>
      <span role="cell">{entry.awayCode}</span>
      <div role="cell" className="flex">
        <MatchHistoryResult entry={entry} />
      </div>
    </div>
  );
}
