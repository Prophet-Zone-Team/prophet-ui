import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import {
  HighImpactSentimentIcon,
  NegativeSentimentIcon,
  PositiveSentimentIcon
} from "./icons";
import { SignalSummaryTag } from "./signal-summary-tag";
import type { SignalSummaryStats } from "./types";

export type SignalSummaryBarProps = {
  summary: SignalSummaryStats;
  className?: string;
};

export function SignalSummaryBar({ summary, className }: SignalSummaryBarProps) {
  const t = useTranslations("signal");

  return (
    <div
      className={cn("flex flex-wrap items-center gap-[8px]", className)}
    >
      <SignalSummaryTag
        label={t("todaySignal")}
        count={summary.todaySignal}
        tone="neutral"
      />
      <SignalSummaryTag
        label={t("positive")}
        count={summary.positive}
        tone="positive"
        icon={<PositiveSentimentIcon />}
      />
      <SignalSummaryTag
        label={t("negative")}
        count={summary.negative}
        tone="negative"
        icon={<NegativeSentimentIcon />}
      />
    </div>
  );
}
