import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { ExpandToggle } from "@/views/markets/content/market-item/expand-toggle";
import { LiveIndicator } from "@/views/markets/content/market-item/live-indicator";

export function MarketItemHeader({
  kickoffLabel,
  isLive,
  expanded,
  totalCount,
  onToggleExpanded,
  centerContent
}: {
  kickoffLabel: string;
  isLive?: boolean;
  expanded: boolean;
  totalCount: number;
  onToggleExpanded: () => void;
  centerContent?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 pt-4",
        expanded && "border-b border-[#EBEBEB] pb-4"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {isLive ? <LiveIndicator dotOnly /> : null}
          <span
            className={cn(
              "text-[14px] font-[400] leading-[18px]",
              isLive ? "text-[#7BCA25]" : "text-[#909090]"
            )}
          >
            {kickoffLabel}
          </span>
        </div>
        <ExpandToggle
          expanded={expanded}
          totalCount={totalCount}
          onToggle={onToggleExpanded}
        />
      </div>

      {centerContent ? (
        <div className="flex justify-center">{centerContent}</div>
      ) : null}
    </div>
  );
}
