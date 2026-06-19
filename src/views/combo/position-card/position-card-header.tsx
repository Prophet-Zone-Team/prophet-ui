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
      <h2 className="m-0 text-sm font-[500] leading-[18px] text-black">
        {formatComboPicksLabel(pickCount)}
      </h2>

      <span className="inline-flex h-7 shrink-0 items-center rounded-[15px] bg-black px-3 text-sm font-[500] leading-[18px] text-white">
        {formatComboMultiplierLabel(multiplier)}
      </span>
    </div>
  );
}
