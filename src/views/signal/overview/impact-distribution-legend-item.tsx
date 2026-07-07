"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

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

const SENTIMENT_KEYS: Record<ImpactSentiment, "positive" | "negative"> = {
  positive: "positive",
  negative: "negative"
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
  const t = useTranslations("signal");
  const formatted = formatImpactCountWithPercent(count, percent);
  const Icon = ICONS[sentiment];

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex min-w-0 items-center gap-[8px]">
        <span className="shrink-0 [&_svg]:size-[26px]">
          <Icon />
        </span>
        <span className="truncate text-[16px] font-[500] leading-[19px] text-prophet-foreground">
          {t(SENTIMENT_KEYS[sentiment])}
        </span>
      </div>
      <span className="mt-[7px] shrink-0 text-[16px] font-[500] leading-[19px] text-right">
        <span className="text-prophet-foreground">{formatted.count}</span>{" "}
        <span className="text-prophet-muted font-[400]">{formatted.percent}</span>
      </span>
    </div>
  );
}
