"use client";

import Drawer, { DrawerDirection } from "@/components/drawer";
import { Switch } from "@/components/ui/switch";
import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";
import type {
  ScheduleFilterTeam,
  ScheduleSortKey
} from "@/lib/market/schedule-match";
import type { Team } from "@/types/market";
import { ScheduleFilterTriggerButton } from "@/views/home/matches/schedule-filter-trigger-button";
import { ScheduleTeamFilter } from "@/views/home/matches/schedule-team-filter";
import { useMemo, useState } from "react";

const SCHEDULE_SORT_OPTIONS: { key: ScheduleSortKey; label: string }[] = [
  { key: "volume", label: "Volume" },
  { key: "time", label: "Time" }
];

export interface ScheduleFilterBarProps {
  sortKey: ScheduleSortKey;
  showEnded: boolean;
  teams: ScheduleFilterTeam[];
  selectedTeamIds: Team["id"][];
  onSortKeyChange: (key: ScheduleSortKey) => void;
  onShowEndedChange: (value: boolean) => void;
  onSelectedTeamIdsChange: (teamIds: Team["id"][]) => void;
}

export function ScheduleFilterBar({
  sortKey,
  showEnded,
  teams,
  selectedTeamIds,
  onSortKeyChange,
  onShowEndedChange,
  onSelectedTeamIdsChange
}: ScheduleFilterBarProps) {
  const isMobile = useDevice();
  const [sortDrawerOpen, setSortDrawerOpen] = useState(false);
  const currentSortLabel = useMemo(
    () => SCHEDULE_SORT_OPTIONS.find((option) => option.key === sortKey)?.label ?? "Time",
    [sortKey]
  );

  return (
    <div
      className="mt-[30px] mb-3 flex min-h-[34px] items-center justify-between gap-3 rounded-[20px] px-3 md:px-0"
      role="toolbar"
      aria-label="Schedule filters and sorting"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-3">
        {isMobile ? (
          <>
            <ScheduleFilterTriggerButton
              label={currentSortLabel}
              open={sortDrawerOpen}
              ariaHaspopup="dialog"
              onClick={() => setSortDrawerOpen((current) => !current)}
            />
            <Drawer
              open={sortDrawerOpen}
              onClose={() => setSortDrawerOpen(false)}
              title="Sort by"
              direction={DrawerDirection.Bottom}
              className="!h-auto max-h-[40dvh]"
            >
              <div className="flex flex-col gap-2 px-4 pb-6">
                {SCHEDULE_SORT_OPTIONS.map((option) => (
                  <SortPill
                    key={option.key}
                    label={option.label}
                    active={sortKey === option.key}
                    className="w-full justify-center"
                    onClick={() => {
                      onSortKeyChange(option.key);
                      setSortDrawerOpen(false);
                    }}
                  />
                ))}
              </div>
            </Drawer>
          </>
        ) : (
          <>
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
          </>
        )}
        <div className="w-[1px] h-[32px] bg-[#090909] mx-2" />
        <ScheduleTeamFilter
          teams={teams}
          selectedTeamIds={selectedTeamIds}
          onSelectedTeamIdsChange={onSelectedTeamIdsChange}
        />
      </div>

      <label className="flex shrink-0 cursor-pointer items-center gap-2">
        <Switch
          checked={showEnded}
          onCheckedChange={onShowEndedChange}
          aria-label="Show ended matches"
        />
        <span className="whitespace-nowrap text-sm md:text-[16px] font-normal leading-[19px] text-black">
          Show Ended
        </span>
      </label>
    </div>
  );
}

function SortPill({
  label,
  active,
  className,
  onClick
}: {
  label: string;
  active: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-[34px] items-center gap-1.5 rounded-[20px] border border-[#909090] px-[16px] text-[16px] font-[457] leading-[19px] transition-colors",
        active ? "bg-black text-white" : "bg-white text-black",
        className
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
