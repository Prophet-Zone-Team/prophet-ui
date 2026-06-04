import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { formatImpactCountWithPercent } from "./format";
import {
  NegativeImpactIcon,
  PositiveImpactIcon
} from "./icons";
import type { ImpactSentiment } from "./types";

export type ImpactDistributionLegendItemProps = {
  sentiment: ImpactSentiment;
  count: number;
  percent: number;
  className?: string;
};

const LABELS: Record<ImpactSentiment, string> = {
  positive: "Positive",
  negative: "Negative"
};

const ICONS: Record<ImpactSentiment, () => ReactNode> = {
  positive: () => <PositiveImpactIcon />,
  negative: () => <NegativeImpactIcon />
};

export function ImpactDistributionLegendItem({
  sentiment,
  count,
  percent,
  className
}: ImpactDistributionLegendItemProps) {
  const formatted = formatImpactCountWithPercent(count, percent);
  const Icon = ICONS[sentiment];

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex min-w-0 items-center gap-[8px]">
        <span className="shrink-0 [&_svg]:size-[26px]">
          <Icon />
        </span>
        <span className="truncate text-[16px] font-[500] leading-[19px] text-black">
          {LABELS[sentiment]}
        </span>
      </div>
      <span className="mt-[7px] shrink-0 text-[16px] font-[500] leading-[19px] text-right">
        <span className="text-black">{formatted.count}</span>{" "}
        <span className="text-[#909090] font-[400]">{formatted.percent}</span>
      </span>
    </div>
  );
}
