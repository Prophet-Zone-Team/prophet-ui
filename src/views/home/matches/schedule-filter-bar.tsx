"use client";

import { cn } from "../../../lib/cn";
import type { ScheduleSortKey } from "../../../lib/market/schedule-match";

export interface ScheduleFilterBarProps {
  sortKey: ScheduleSortKey;
  showEnded: boolean;
  onSortKeyChange: (key: ScheduleSortKey) => void;
  onShowEndedChange: (value: boolean) => void;
}

export function ScheduleFilterBar({
  sortKey,
  showEnded,
  onSortKeyChange,
  onShowEndedChange
}: ScheduleFilterBarProps) {
  return (
    <div
      className="mb-3 flex h-[34px] items-center justify-between gap-3 rounded-[20px] px-3 sm:px-4"
      role="toolbar"
      aria-label="Schedule filters and sorting"
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <SortPill
          label="Volume"
          active={sortKey === "volume"}
          onClick={() => onSortKeyChange("volume")}
        />
        <SortPill
          label="Time"
          active={sortKey === "time"}
          onClick={() => onSortKeyChange("time")}
        />
      </div>

      <label className="flex shrink-0 cursor-pointer items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={showEnded}
          aria-label="Show ended matches"
          className={cn(
            "relative h-4 w-[29px] shrink-0 rounded-lg border border-[#EAEAEA] transition-colors",
            showEnded ? "bg-[#909090]" : "bg-[#EBEBEB]"
          )}
          onClick={() => onShowEndedChange(!showEnded)}
        >
          <span
            className={cn(
              "absolute top-1/2 size-3 -translate-y-1/2 rounded-lg border border-[#EAEAEA] bg-white transition-[left]",
              showEnded ? "left-[calc(100%-14px)]" : "left-0.5"
            )}
            aria-hidden
          />
        </button>
        <span className="whitespace-nowrap text-base font-normal leading-[19px] text-black">
          Show Ended
        </span>
      </label>
    </div>
  );
}

function SortPill({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-[34px] items-center gap-1.5 rounded-[20px] border border-[#909090] px-3 text-base font-normal leading-[19px] transition-colors",
        active ? "bg-black text-white" : "bg-white text-black"
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
      {/* {active ? (
        <span
          className="inline-block size-0 border-x-[3px] border-b-[5px] border-x-transparent border-b-white"
          aria-hidden
        />
      ) : null} */}
    </button>
  );
}
