import type { ReactNode } from "react";

import { formatPortfolioDateTime } from "@/lib/portfolio/portfolio-format";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
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
      <span className="text-sm font-[400] leading-[18px] text-black">
        {label}
      </span>
      <span
        className={
          valueClassName ??
          "text-sm font-[500] leading-[18px] text-black"
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
    <div className="flex flex-col gap-2 px-4 pb-4 pt-3">
      <SummaryRow
        label="Time"
        value={
          firstEntryAt?.trim()
            ? formatPortfolioDateTime(firstEntryAt)
            : "—"
        }
        valueClassName="text-sm font-[400] leading-[18px] text-black"
      />
      <SummaryRow label="Cost" value={formatTeamDetailMoney(stakeAmount)} />
      <SummaryRow
        label={
          <span className="inline-flex items-center gap-2">
            <span>To Win</span>
            <span className="inline-flex h-7 items-center rounded-[15px] bg-black px-3 text-sm font-[500] leading-[18px] text-white">
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
