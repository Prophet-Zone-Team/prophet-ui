"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import type { ImpactSentiment } from "./types";

export type ImpactDistributionBarProps = {
  segments: Array<{
    sentiment: ImpactSentiment;
    count: number;
  }>;
  className?: string;
};

const SEGMENT_COLORS: Record<ImpactSentiment, string> = {
  positive: "bg-[#65AF14]",
  negative: "bg-[#FF674B]"
};

export function ImpactDistributionBar({
  segments,
  className
}: ImpactDistributionBarProps) {
  const t = useTranslations("signal");
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);

  return (
    <div
      className={cn("flex h-[10px] w-full gap-[4px]", className)}
      role="img"
      aria-label={t("impactDistributionBar")}
    >
      {segments.map((segment) => {
        const widthPercent =
          total > 0 ? (segment.count / total) * 100 : 100 / segments.length;

        return (
          <div
            key={segment.sentiment}
            className={cn(
              "h-full min-w-[5px] rounded-[8px]",
              SEGMENT_COLORS[segment.sentiment]
            )}
            style={{ width: `${widthPercent}%` }}
          />
        );
      })}
    </div>
  );
}
