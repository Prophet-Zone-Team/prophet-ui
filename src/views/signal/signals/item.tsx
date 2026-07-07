"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  NegativeSentimentIcon,
  PositiveSentimentIcon
} from "@/views/analytics/news/icons";

export type SignalNewsItemVariant =
  | "today"
  | "positive"
  | "negative";

export type SignalNewsItemProps = {
  variant: SignalNewsItemVariant;
  count: number;
  className?: string;
};

const BACKGROUND_CLASS_NAMES: Record<SignalNewsItemVariant, string> = {
  today: "bg-[rgba(144,144,144,0.1)] dark:bg-[#404045]/10",
  positive: "bg-[#7BCA25]/10",
  negative: "bg-[#FF674B]/10",
};

const VARIANT_KEYS: Record<
  SignalNewsItemVariant,
  "todaySignal" | "positive" | "negative"
> = {
  today: "todaySignal",
  positive: "positive",
  negative: "negative",
};

const ICONS: Record<SignalNewsItemVariant, () => ReactNode> = {
  today: () => null,
  positive: () => <PositiveSentimentIcon />,
  negative: () => <NegativeSentimentIcon />,
};

export function SignalNewsItem({
  variant,
  count,
  className
}: SignalNewsItemProps) {
  const t = useTranslations("signal");
  const label = t(VARIANT_KEYS[variant]);
  const Icon = ICONS[variant];

  return (
    <div
      className={cn(
        "flex h-[56px] w-full max-w-none items-center justify-between rounded-[8px] px-3 md:px-[16px]",
        BACKGROUND_CLASS_NAMES[variant],
        className
      )}
      aria-label={t("summaryCountAria", { label, count })}
    >
      <div className="flex min-w-0 items-center gap-[8px]">
        <span className="shrink-0 [&_svg]:size-[26px]">
          <Icon />
        </span>
        <span className="truncate text-[16px] font-[500] leading-[19px] text-prophet-foreground">
          {label}
        </span>
      </div>
      <span className="shrink-0 text-[16px] font-[500] leading-[19px] text-prophet-foreground">
        {count}
      </span>
    </div>
  );
}
