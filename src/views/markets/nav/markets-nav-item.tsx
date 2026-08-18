"use client";

import { cn } from "@/lib/cn";
import type { MarketsNavItemConfig } from "@/views/markets/nav/config";
import { MarketsNavIcon } from "@/views/markets/nav/icons";

export interface MarketsNavItemProps {
  item: MarketsNavItemConfig;
  label: string;
  selected: boolean;
  onSelect: (id: MarketsNavItemConfig["id"]) => void;
}

export function MarketsNavItem({
  item,
  label,
  selected,
  onSelect
}: MarketsNavItemProps) {
  return (
    <button
      type="button"
      aria-current={selected ? "page" : undefined}
      onClick={() => onSelect(item.id)}
      className={cn(
        "group flex w-full items-center gap-2 rounded-[12px] px-3 py-3 text-left transition-[background-color,color] duration-150",
        selected
          ? "bg-[#F1F2F4] dark:bg-white/[0.08]"
          : "hover:bg-[#F1F2F4]/70 dark:hover:bg-white/[0.06]"
      )}
    >
      <span className="flex size-5 shrink-0 items-center justify-center">
        <MarketsNavIcon icon={item.icon} />
      </span>

      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[14px] font-[500] leading-[18px] transition-colors duration-150",
          selected
            ? "text-black dark:text-prophet-foreground"
            : "text-[#909090] group-hover:text-black dark:group-hover:text-prophet-foreground"
        )}
      >
        {label}
      </span>

      <span
        className={cn(
          "shrink-0 text-right text-[14px] font-[500] leading-[18px] tabular-nums transition-colors duration-150",
          selected
            ? "text-black dark:text-prophet-foreground"
            : "text-[#909090] group-hover:text-black dark:group-hover:text-prophet-foreground"
        )}
      >
        {item.count}
      </span>
    </button>
  );
}
