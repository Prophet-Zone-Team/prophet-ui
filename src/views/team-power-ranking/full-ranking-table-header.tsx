import { cn } from "@/lib/cn";

/** Column widths as percentages (sum = 100%) */
const HEADER_GRID =
  "hidden md:grid w-full grid-cols-[5%_13%_10%_15%_15%_13%_13%_13%] items-center gap-x-2 px-5";

export function FullRankingTableHeader() {
  return (
    <div
      role="row"
      className={cn(
        HEADER_GRID,
        "text-[16px] font-[400] leading-[19px] text-[#909090]"
      )}
    >
      <span role="columnheader">Rank</span>
      <span role="columnheader">Team</span>
      <span role="columnheader">Group</span>
      <span role="columnheader">Title Odds</span>
      <span role="columnheader">Advance Odds</span>
      <span role="columnheader">Path Difficulty</span>
      <span role="columnheader">Recent Trend</span>
      <span role="columnheader">Signal Status</span>
    </div>
  );
}

export { HEADER_GRID as fullRankingTableGridClass };
