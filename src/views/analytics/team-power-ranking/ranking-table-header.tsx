import { rankingPreviewTableGridClass } from "./table-grid";

export function RankingTableHeader() {
  return (
    <div
      role="row"
      className={`${rankingPreviewTableGridClass} px-[20px] text-[14px] font-[400] leading-[17px] text-[#909090]`}
    >
      <span role="columnheader">Rank</span>
      <span role="columnheader">Team</span>
      <span role="columnheader">Title Probability</span>
      <span role="columnheader">Round of 16</span>
      <span role="columnheader" className="text-right">
        Trend
      </span>
    </div>
  );
}
