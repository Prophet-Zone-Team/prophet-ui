import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { ExpandToggle } from "@/views/combo/combo-item/expand-toggle";
import { LiveIndicator } from "@/views/combo/combo-item/live-indicator";

export function ComboItemHeader({
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
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="text-sm font-[400] leading-[18px] text-[#909090]">
            {kickoffLabel}
          </span>
          {isLive ? <LiveIndicator compact={expanded} /> : null}
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
