import { cn } from "@/lib/cn";

import { formatAdvanceOdds, formatTitleProbability } from "./format";
import { fullRankingTableGridClass } from "./full-ranking-table-header";
import { OddsProgressBar } from "./odds-progress-bar";
import { PathDifficultyLabel } from "./path-difficulty-label";
import { SignalStatusLabel } from "./signal-status-label";
import { TeamInfo } from "./team-info";
import { TrendIndicator } from "./trend-indicator";
import type { TeamPowerRankingEntry } from "./types";

export type FullRankingTableRowProps = {
  entry: TeamPowerRankingEntry;
  titleOddsMax: number;
  advanceOddsMax: number;
};

export function FullRankingDesktopRow({
  entry,
  titleOddsMax,
  advanceOddsMax
}: FullRankingTableRowProps) {
  return (
    <div
      role="row"
      className={`${fullRankingTableGridClass} items-center py-[10px] text-[16px] font-[457] leading-[19px] text-black`}
    >
      <span role="cell">{entry.rank}</span>
      <div role="cell" className="min-w-0">
        <TeamInfo
          teamCode={entry.teamCode}
          teamName={entry.teamName}
          label="name"
          textClassName="text-[16px] leading-[19px]"
        />
      </div>
      <span role="cell">{entry.group}</span>
      <div role="cell" className="flex items-center gap-[14px]">
        <span className="shrink-0 tabular-nums">
          {formatTitleProbability(entry.titleProbability)}
        </span>
        <OddsProgressBar
          value={entry.titleProbability}
          max={titleOddsMax}
          className="w-[86px]"
        />
      </div>
      <div role="cell" className="flex items-center gap-[14px]">
        <span className="shrink-0 tabular-nums">
          {formatAdvanceOdds(entry.roundOf16Probability)}
        </span>
        <OddsProgressBar
          value={entry.roundOf16Probability}
          max={advanceOddsMax}
          className="w-[86px]"
        />
      </div>
      <span role="cell">
        <PathDifficultyLabel difficulty={entry.pathDifficulty} />
      </span>
      <span role="cell" className="flex justify-start">
        <TrendIndicator trend={entry.trend} />
      </span>
      <span role="cell">
        <SignalStatusLabel status={entry.signalStatus} />
      </span>
    </div>
  );
}

export function FullRankingMobileCard({
  entry,
  titleOddsMax,
  advanceOddsMax,
  className
}: FullRankingTableRowProps & { className?: string }) {
  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-[6px] px-3 py-3 text-[14px] font-[457] leading-[17px] text-black",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="w-8 shrink-0 tabular-nums text-[16px] font-[500]">
            {entry.rank}
          </span>
          <TeamInfo
            teamCode={entry.teamCode}
            teamName={entry.teamName}
            label="name"
            textClassName="text-[14px] leading-[17px]"
            className="min-w-0"
          />
        </div>
        <span className="shrink-0 text-[14px] leading-[17px] text-[#909090]">
          {entry.group}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] leading-[17px] text-[#909090]">Title Odds</span>
          <span className="shrink-0 tabular-nums text-black">
            {formatTitleProbability(entry.titleProbability)}
          </span>
        </div>
        <OddsProgressBar
          value={entry.titleProbability}
          max={titleOddsMax}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] leading-[17px] text-[#909090]">
            Advance Odds
          </span>
          <span className="shrink-0 tabular-nums text-black">
            {formatAdvanceOdds(entry.roundOf16Probability)}
          </span>
        </div>
        <OddsProgressBar
          value={entry.roundOf16Probability}
          max={advanceOddsMax}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-[#EBEBEB] pt-2">
        <div className="flex min-w-0 flex-col items-start gap-1">
          <span className="text-[12px] leading-[17px] text-[#909090]">Path</span>
          <PathDifficultyLabel difficulty={entry.pathDifficulty} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[12px] leading-[17px] text-[#909090]">Trend</span>
          <TrendIndicator trend={entry.trend} />
        </div>
        <div className="flex min-w-0 flex-col items-end gap-1">
          <span className="text-[12px] leading-[17px] text-[#909090]">Signal</span>
          <SignalStatusLabel status={entry.signalStatus} />
        </div>
      </div>
    </article>
  );
}
