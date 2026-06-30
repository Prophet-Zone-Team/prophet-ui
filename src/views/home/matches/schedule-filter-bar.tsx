"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import type {
  ScheduleFilterTeam,
  ScheduleSortKey
} from "@/lib/market/schedule-match";
import type { Team } from "@/types/market";
import { ScheduleTeamFilter } from "@/views/home/matches/schedule-team-filter";
import { useTranslations } from "next-intl";

export interface ScheduleFilterBarProps {
  sortKey: ScheduleSortKey;
  showEnded: boolean;
  teams: ScheduleFilterTeam[];
  selectedTeamIds: Team["id"][];
  teamSearchQuery: string;
  onSortKeyChange: (key: ScheduleSortKey) => void;
  onShowEndedChange: (value: boolean) => void;
  onSelectedTeamIdsChange: (teamIds: Team["id"][]) => void;
  onTeamSearchQueryChange: (query: string) => void;
}

export function ScheduleFilterBar({
  sortKey,
  showEnded,
  teams,
  selectedTeamIds,
  teamSearchQuery,
  onSortKeyChange,
  onShowEndedChange,
  onSelectedTeamIdsChange,
  onTeamSearchQueryChange
}: ScheduleFilterBarProps) {
  const t = useTranslations("home");

  return (
    <>
      <div
        className="md:mt-[30px] mb-3 flex min-h-[34px] items-center justify-between gap-3 rounded-[20px] px-3 md:px-0"
        role="toolbar"
        aria-label={t("scheduleFiltersAndSorting")}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-3">
          <SortPill
            label={t("volume")}
            active={sortKey === "volume"}
            onClick={() => onSortKeyChange("volume")}
          />
          <SortPill
            label={t("time")}
            active={sortKey === "time"}
            onClick={() => onSortKeyChange("time")}
          />
          <div className="mx-2 hidden h-[32px] w-[1px] bg-[#090909] md:block" />
          <div className="hidden md:block">
            <ScheduleTeamFilter
              teams={teams}
              selectedTeamIds={selectedTeamIds}
              onSelectedTeamIdsChange={onSelectedTeamIdsChange}
            />
          </div>
        </div>

        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <Switch
            checked={showEnded}
            onCheckedChange={onShowEndedChange}
            aria-label={t("showEndedMatches")}
          />
          <span className="whitespace-nowrap text-[12px] font-normal leading-[19px] text-prophet-foreground md:text-[16px]">
            {t("showEnded")}
          </span>
        </label>
      </div>

      <div className="mb-3 px-3 md:hidden">
        <ScheduleTeamFilter
          teams={teams}
          selectedTeamIds={selectedTeamIds}
          teamSearchQuery={teamSearchQuery}
          onSelectedTeamIdsChange={onSelectedTeamIdsChange}
          onTeamSearchQueryChange={onTeamSearchQueryChange}
        />
      </div>
    </>
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
        "inline-flex md:h-[34px] h-[30px] items-center gap-1.5 rounded-[20px] border border-prophet-muted px-[10px] md:px-[16px] text-[12px] md:text-[16px] font-[400] leading-[19px] transition-colors",
        active ? "bg-black dark:bg-prophet-primary text-white" : "bg-prophet-panel text-prophet-foreground",
        className
      )}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
