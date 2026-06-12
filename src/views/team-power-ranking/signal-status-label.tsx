import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import type { TeamPowerRankingSignalStatus } from "./types";

export type SignalStatusLabelProps = {
  status: TeamPowerRankingSignalStatus;
  className?: string;
};

const STATUS_COLORS: Record<TeamPowerRankingSignalStatus, string> = {
  Positive: "text-[#65AF14]",
  Negative: "text-[#FF674B]",
  Neutral: "text-[#909090]",
};

export function SignalStatusLabel({ status, className }: SignalStatusLabelProps) {
  const t = useTranslations("analytics");

  const labelByStatus: Record<TeamPowerRankingSignalStatus, string> = {
    Positive: t("signalPositive"),
    Negative: t("signalNegative"),
    Neutral: t("signalNeutral"),
  };

  return (
    <span
      className={cn(
        "text-[16px] font-[400] leading-[19px]",
        STATUS_COLORS[status],
        className
      )}
    >
      {labelByStatus[status]}
    </span>
  );
}
