import { ArrowUpRight } from "lucide-react";

import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { cn } from "@/lib/cn";

import { getGroupLabel } from "./utils";

export function GroupBadge({
  group,
  className,
}: {
  group: WorldCup2026Group;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-[36px] items-center gap-1.5 rounded-[8px] border border-[#909090] bg-white px-3 text-[18px] font-medium leading-normal text-black",
        className,
      )}
      aria-label={getGroupLabel(group)}
    >
      <span>{getGroupLabel(group)}</span>
      <ArrowUpRight className="size-[14px] shrink-0 stroke-[2]" aria-hidden />
    </button>
  );
}
