import type { TeamPowerRankingTrend } from "./types";

export type TrendIndicatorProps = {
  trend: TeamPowerRankingTrend;
  className?: string;
};

export function TrendIndicator({ trend, className }: TrendIndicatorProps) {
  const isDown = trend === "down";

  return isDown ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="16"
      viewBox="0 0 14 16"
      fill="none"
    >
      <path
        d="M7 1V14M13 8L7 14L1 8"
        stroke="#FF674B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="16"
      viewBox="0 0 14 16"
      fill="none"
    >
      <path
        d="M7 14.4141V1.41406M13 7.41406L7 1.41406L1 7.41406"
        stroke="#65AF14"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
