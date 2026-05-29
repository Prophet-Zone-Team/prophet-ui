"use client";

import { cn } from "@/lib/cn";

import { MatchHistoryDesktopRow, MatchHistoryMobileCard } from "./row";
import { matchHistoryTableGridClass } from "./table-grid";
import type { MatchHistoryEntry } from "./types";

export type MatchHistoryProps = {
  matches?: MatchHistoryEntry[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
};

export function MatchHistory({
  matches = [],
  isLoading = false,
  isError = false,
  className
}: MatchHistoryProps) {
  return (
    <section
      aria-label="Match history"
      className={cn(
        "w-full max-w-none md:max-w-[531px] rounded-[12px] bg-white px-[12px] py-[16px]",
        "shadow-[0_0_10px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      <h2 className="m-0 text-[18px] font-[500] leading-[21px] text-black">
        Match History
      </h2>

      <div className="mt-[12px] flex w-full flex-col">
        {isLoading ? (
          <p className="py-6 text-center text-[14px] font-[457] leading-[17px] text-[#909090]">
            Loading...
          </p>
        ) : isError ? (
          <p className="py-6 text-center text-[14px] font-[457] leading-[17px] text-[#909090]">
            Unable to load data.
          </p>
        ) : matches.length === 0 ? (
          <p className="py-6 text-center text-[14px] font-[457] leading-[17px] text-[#909090]">
            No match history is available yet.
          </p>
        ) : (
          <>
            <div
              role="table"
              aria-label="Head-to-head match history"
              className="hidden w-full flex-col md:flex"
            >
              <div
                role="row"
                className={cn(
                  matchHistoryTableGridClass,
                  "px-[12px] pb-[8px] text-[12px] font-[400] leading-[17px] text-[#909090]"
                )}
              >
                <span role="columnheader">Time</span>
                <span role="columnheader">Format</span>
                <span role="columnheader">Home</span>
                <span role="columnheader" className="text-center">
                  VS
                </span>
                <span role="columnheader">Away</span>
                <span role="columnheader">Result</span>
              </div>

              <div className="flex flex-col gap-[2px]">
                {matches.map((entry, index) => (
                  <MatchHistoryDesktopRow
                    key={entry.id}
                    entry={entry}
                    highlighted={index % 2 === 0}
                    tall={Boolean(entry.penaltyScore)}
                  />
                ))}
              </div>
            </div>

            <div
              className="flex flex-col gap-2 md:hidden"
              aria-label="Head-to-head match history"
            >
              {matches.map((entry, index) => (
                <MatchHistoryMobileCard
                  key={entry.id}
                  entry={entry}
                  highlighted={index % 2 === 0}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export type {
  MatchHistoryEntry,
  MatchHistoryResultKind,
  MatchHistoryTeamOption
} from "./types";
