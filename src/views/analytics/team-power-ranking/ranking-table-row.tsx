import { formatRoundOf16Probability, formatTitleProbability } from "./format";
import { TeamInfo } from "./team-info";
import { TrendIndicator } from "./trend-indicator";
import type { TeamPowerRankingEntry } from "./types";

export type RankingTableRowProps = {
  entry: TeamPowerRankingEntry;
};

export function RankingTableRow({ entry }: RankingTableRowProps) {
  return (
    <div
      role="row"
      className="grid grid-cols-[28px_minmax(0,1fr)_105px_78px_38px] items-center gap-x-[12px] px-[20px] py-[6px] text-[14px] font-[300] leading-[17px] text-black"
    >
      <span role="cell">{entry.rank}</span>
      <div role="cell" className="min-w-0">
        <TeamInfo teamCode={entry.teamCode} teamName={entry.teamName} />
      </div>
      <span role="cell">{formatTitleProbability(entry.titleProbability)}</span>
      <span role="cell" className="text-center">
        {formatRoundOf16Probability(entry.roundOf16Probability)}
      </span>
      <span role="cell" className="flex justify-center">
        <TrendIndicator trend={entry.trend} />
      </span>
    </div>
  );
}
