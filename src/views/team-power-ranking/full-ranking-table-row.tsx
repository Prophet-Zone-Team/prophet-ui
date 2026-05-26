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

export function FullRankingTableRow({
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
