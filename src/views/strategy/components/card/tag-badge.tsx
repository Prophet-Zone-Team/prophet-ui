import { cn } from "@/lib/cn";

import type { StrategyTagBadgeVariant } from "./types";

const TAG_BADGE_CONFIG: Record<
  StrategyTagBadgeVariant,
  { label: string; className: string }
> = {
  high_return: {
    label: "High Return",
    className: "bg-gradient-to-r from-[#F4C22F] to-[#AD8F38] text-white"
  },
  low_risk: {
    label: "Low Risk",
    className: "bg-gradient-to-r from-[#247950] to-[#43DF93] text-white"
  }
};

export type StrategyTagBadgeProps = {
  variant: StrategyTagBadgeVariant;
  className?: string;
};

export function StrategyTagBadge({
  variant,
  className
}: StrategyTagBadgeProps) {
  const config = TAG_BADGE_CONFIG[variant];

  return (
    <span
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-2xl px-3",
        "font-[Sora] text-sm font-normal leading-[17px]",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
