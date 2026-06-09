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
      <div className="flex flex-col items-end gap-[2px] md:items-start">
        <span className="text-[14px] leading-[17px] text-[#909090]">Draw</span>
        <span className="text-[14px] leading-[17px] text-[#FF674B]">
          Lost on Penalties
        </span>
      </div>
    );
  }

  return (
    <span className="text-[14px] font-[400] leading-[17px] text-[#909090]">
      Draw
    </span>
  );
}

export function MatchHistoryDesktopRow({
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
        "items-center rounded-[6px] px-[12px] text-[12px] font-[400] leading-[17px] text-black",
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

export function MatchHistoryMobileCard({
  entry,
  highlighted = false
}: MatchHistoryRowProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-2 rounded-[6px] px-3 py-3 text-[12px] font-[400] leading-[17px] text-black",
        highlighted ? "bg-[#F9FAFC]" : "bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="shrink-0 whitespace-nowrap">
          {formatMatchHistoryDate(entry.playedAt)}
        </span>
        <span className="min-w-0 truncate text-right text-[#909090]">
          {entry.format}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="w-10 shrink-0 text-[14px] font-[500]">
          {entry.homeCode}
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
          <span className="text-[14px] font-[500] leading-[17px]">
            {formatMatchScore(entry.homeScore, entry.awayScore)}
          </span>
          {entry.penaltyScore ? (
            <span className="mt-[2px] whitespace-nowrap text-[12px] font-[400] leading-[17px] text-black">
              {entry.penaltyScore} penalties
            </span>
          ) : null}
        </div>
        <span className="w-10 shrink-0 text-right text-[14px] font-[500]">
          {entry.awayCode}
        </span>
      </div>

      <div className="flex items-start justify-between gap-3 border-t border-[#EBEBEB] pt-2">
        <span className="text-[12px] leading-[17px] text-[#909090]">
          Result
        </span>
        <MatchHistoryResult entry={entry} />
      </div>
    </article>
  );
}
