import { cn } from "@/lib/cn";

import type { TeamPowerRankingTrend } from "./types";

export type TrendIndicatorProps = {
  trend: TeamPowerRankingTrend;
  className?: string;
};

export function TrendIndicator({ trend, className }: TrendIndicatorProps) {
  if (trend === "neutral") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="16"
        viewBox="0 0 14 16"
        fill="none"
        className={className}
        aria-hidden
      >
        <path
          d="M1 8H13"
          stroke="#909090"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (trend === "new") {
    return (
      <span className="h-[24px] px-2 text-[#65AF14] text-xs font-[400] bg-[rgba(101,175,20,0.10)] rounded-xl flex justify-center items-center">
        New
      </span>
    );
  }

  const isDown = trend === "down";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="16"
      viewBox="0 0 14 16"
      fill="none"
      className={cn(className)}
      aria-hidden
    >
      {isDown ? (
        <path
          d="M7 1V14M13 8L7 14L1 8"
          stroke="#FF674B"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M7 14.4141V1.41406M13 7.41406L7 1.41406L1 7.41406"
          stroke="#65AF14"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
