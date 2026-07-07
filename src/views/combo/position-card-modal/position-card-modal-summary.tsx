import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { formatPortfolioDateTime } from "@/lib/portfolio/portfolio-format";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import {
  comboMultiplierBadgeClass,
  comboTitleTextClass
} from "@/views/combo/combo-ui";
import {
  formatComboMultiplierLabel
} from "@/views/combo/combo-widget/formatters";

export type PositionCardModalSummaryProps = {
  multiplier: number;
  stakeAmount: number;
  toWinAmount: number;
  firstEntryAt?: string;
};

function SummaryRow({
  label,
  value,
  valueClassName
}: {
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn("text-sm font-[400] leading-[18px]", comboTitleTextClass)}>
        {label}
      </span>
      <span
        className={
          valueClassName ??
          cn("text-sm font-[500] leading-[18px]", comboTitleTextClass)
        }
      >
        {value}
      </span>
    </div>
  );
}

export function PositionCardModalSummary({
  multiplier,
  stakeAmount,
  toWinAmount,
  firstEntryAt
}: PositionCardModalSummaryProps) {
  return (
    <div className="flex flex-col gap-2 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
      <SummaryRow
        label="Time"
        value={
          firstEntryAt?.trim()
            ? formatPortfolioDateTime(firstEntryAt)
            : "—"
        }
        valueClassName={cn("text-sm font-[400] leading-[18px]", comboTitleTextClass)}
      />
      <SummaryRow label="Cost" value={formatTeamDetailMoney(stakeAmount)} />
      <SummaryRow
        label={
          <span className="inline-flex items-center gap-2">
            <span>To Win</span>
            <span className={comboMultiplierBadgeClass}>
              {formatComboMultiplierLabel(multiplier)}
            </span>
          </span>
        }
        value={formatTeamDetailMoney(toWinAmount)}
        valueClassName="text-sm font-[500] leading-[18px] text-[#69C800]"
      />
    </div>
  );
}
