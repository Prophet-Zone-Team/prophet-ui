import { cn } from "@/lib/cn";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import {
  comboMutedTextClass,
  comboTitleTextClass
} from "@/views/combo/combo-ui";

export type PositionCardFooterProps = {
  stakeAmount: number;
  toWinAmount: number;
};

export function PositionCardFooter({
  stakeAmount,
  toWinAmount
}: PositionCardFooterProps) {
  return (
    <div className="relative flex h-10 shrink-0 items-center justify-between rounded-lg bg-prophet-panel px-3">
      <span className={cn("text-sm font-[500] leading-[18px]", comboMutedTextClass)}>
        {formatTeamDetailMoney(stakeAmount)}
      </span>

      <span className={cn("text-sm font-[500] leading-[18px]", comboTitleTextClass)}>
        To win {formatTeamDetailMoney(toWinAmount)}
      </span>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[-33px] h-[33px] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,var(--prophet-bg-panel)_100%)]"
      />
    </div>
  );
}
