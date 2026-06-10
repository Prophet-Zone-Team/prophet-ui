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
  return (
    <div
      className={cn("flex flex-wrap items-center gap-[8px]", className)}
    >
      <SignalSummaryTag
        label="Today's Signal"
        count={summary.todaySignal}
        tone="neutral"
      />
      <SignalSummaryTag
        label="Positive"
        count={summary.positive}
        tone="positive"
        icon={<PositiveSentimentIcon />}
      />
      <SignalSummaryTag
        label="Negative"
        count={summary.negative}
        tone="negative"
        icon={<NegativeSentimentIcon />}
      />
    </div>
  );
}
