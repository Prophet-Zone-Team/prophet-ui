import { cn } from "@/lib/cn";

import type { TeamPowerRankingSignalStatus } from "./types";

export type SignalStatusLabelProps = {
  status: TeamPowerRankingSignalStatus;
  className?: string;
};

const LABELS: Record<TeamPowerRankingSignalStatus, string> = {
  positive: "Positive",
  negative: "Negative",
  neutral: "Neutral"
};

const STATUS_COLORS: Record<TeamPowerRankingSignalStatus, string> = {
  positive: "text-[#65AF14]",
  negative: "text-[#FF674B]",
  neutral: "text-[#909090]"
};

export function SignalStatusLabel({ status, className }: SignalStatusLabelProps) {
  return (
    <span
      className={cn(
        "text-[16px] font-[400] leading-[19px]",
        STATUS_COLORS[status],
        className
      )}
    >
      {LABELS[status]}
    </span>
  );
}
