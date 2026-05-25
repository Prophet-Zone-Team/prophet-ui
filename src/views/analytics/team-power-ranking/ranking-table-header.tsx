export function RankingTableHeader() {
  return (
    <div
      role="row"
      className="grid grid-cols-[28px_minmax(0,1fr)_105px_78px_38px] items-center gap-x-[12px] px-[20px] text-[14px] font-[300] leading-[17px] text-[#909090]"
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
