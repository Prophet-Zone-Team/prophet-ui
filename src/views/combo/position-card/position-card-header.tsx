import { cn } from "@/lib/cn";
import {
  comboMultiplierBadgeClass,
  comboTitleTextClass
} from "@/views/combo/combo-ui";
import {
  formatComboMultiplierLabel,
  formatComboPicksLabel
} from "@/views/combo/combo-widget/formatters";

export type PositionCardHeaderProps = {
  pickCount: number;
  multiplier: number;
};

export function PositionCardHeader({
  pickCount,
  multiplier
}: PositionCardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className={cn("m-0 text-sm font-[500] leading-[18px]", comboTitleTextClass)}>
        {formatComboPicksLabel(pickCount)}
      </h2>

      <span className={comboMultiplierBadgeClass}>
        {formatComboMultiplierLabel(multiplier)}
      </span>
    </div>
  );
}
