import { cn } from "@/lib/cn";

import { formatCategoryCountWithPercent, getCategoryColor } from "./format";
import type { SignalCategorySegment } from "./types";

export type TopCategoriesLegendRowProps = {
  category: SignalCategorySegment;
  percent: number;
  highlighted?: boolean;
  className?: string;
};

export function TopCategoriesLegendRow({
  category,
  percent,
  highlighted = false,
  className
}: TopCategoriesLegendRowProps) {
  const color = getCategoryColor(category.id);

  return (
    <div
      className={cn(
        "flex h-[40px] w-full max-w-[364px] items-center justify-between rounded-[8px] px-[12px]",
        highlighted && "bg-prophet-base",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-[8px]">
        <span
          aria-hidden
          className="size-[12px] shrink-0 rounded-[4px]"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-[16px] font-[400] leading-[19px] text-prophet-foreground">
          {category.label}
        </span>
      </div>
      <span className="shrink-0 text-[16px] font-[400] leading-[19px] text-right text-prophet-foreground tabular-nums">
        {formatCategoryCountWithPercent(category.count, percent)}
      </span>
    </div>
  );
}
