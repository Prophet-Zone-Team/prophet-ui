import { formatTeamDetailMoney } from "@/lib/team/detail-format";

export type PositionCardFooterProps = {
  stakeAmount: number;
  toWinAmount: number;
};

export function PositionCardFooter({
  stakeAmount,
  toWinAmount
}: PositionCardFooterProps) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-between rounded-lg bg-white px-3 relative">
      <span className="text-sm font-[500] leading-[18px] text-[#909090]">
        {formatTeamDetailMoney(stakeAmount)}
      </span>

      <span className="text-sm font-[500] leading-[18px] text-black">
        To win {formatTeamDetailMoney(toWinAmount)}
      </span>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[-33px] h-[33px] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,#FFFFFF_100%)]"
      />
    </div>
  );
}
