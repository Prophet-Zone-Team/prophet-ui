import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import {
  HighImpactSentimentIcon,
  NegativeSentimentIcon,
  PositiveSentimentIcon
} from "@/views/analytics/news/icons";

export type SignalNewsItemVariant =
  | "today"
  | "positive"
  | "negative"
  | "high-impact";

export type SignalNewsItemProps = {
  variant: SignalNewsItemVariant;
  count: number;
  className?: string;
};

const BACKGROUND_CLASS_NAMES: Record<SignalNewsItemVariant, string> = {
  today: "bg-[#909090]/10",
  positive: "bg-[#7BCA25]/10",
  negative: "bg-[#FF674B]/10",
  "high-impact": "bg-[#F4B600]/10"
};

const LABELS: Record<SignalNewsItemVariant, string> = {
  today: "Today's Signal",
  positive: "Positive",
  negative: "Negative",
  "high-impact": "High Impact"
};

const ICONS: Record<SignalNewsItemVariant, () => ReactNode> = {
  today: () => null,
  positive: () => <PositiveSentimentIcon />,
  negative: () => <NegativeSentimentIcon />,
  "high-impact": () => <HighImpactSentimentIcon />
};

export function SignalNewsItem({
  variant,
  count,
  className
}: SignalNewsItemProps) {
  const label = LABELS[variant];
  const Icon = ICONS[variant];

  return (
    <div
      className={cn(
        "flex h-[56px] w-full max-w-none items-center justify-between rounded-[8px] px-3 md:max-w-[337px] md:px-[16px]",
        BACKGROUND_CLASS_NAMES[variant],
        className
      )}
      aria-label={`${label}: ${count}`}
    >
      <div className="flex min-w-0 items-center gap-[8px]">
        <span className="shrink-0 [&_svg]:size-[26px]">
          <Icon />
        </span>
        <span className="truncate text-[16px] font-[556] leading-[19px] text-black">
          {label}
        </span>
      </div>
      <span className="shrink-0 text-[16px] font-[556] leading-[19px] text-black">
        {count}
      </span>
    </div>
  );
}
