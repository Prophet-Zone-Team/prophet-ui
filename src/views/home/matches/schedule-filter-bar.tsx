"use client";

import { useTranslations } from "next-intl";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { HomeSearchInput } from "@/views/home/home-search-input";

export interface ScheduleFilterBarProps {
  teamSearchQuery: string;
  liveOnly: boolean;
  showEnded: boolean;
  onTeamSearchQueryChange: (query: string) => void;
  onLiveOnlyChange: (value: boolean) => void;
  onShowEndedChange: (value: boolean) => void;
}

export function ScheduleFilterBar({
  teamSearchQuery,
  liveOnly,
  showEnded,
  onTeamSearchQueryChange,
  onLiveOnlyChange,
  onShowEndedChange
}: ScheduleFilterBarProps) {
  const t = useTranslations("home");

  return (
    <div
      className="mb-3 flex min-h-[34px] flex-col gap-3 rounded-[20px] px-3 md:mt-[30px] md:flex-row md:items-center md:justify-between md:gap-3 md:px-0"
      role="toolbar"
      aria-label={t("scheduleFiltersAndSorting")}
    >
      <HomeSearchInput
        value={teamSearchQuery}
        onChange={onTeamSearchQueryChange}
        placeholder={t("searchTeams")}
        ariaLabel={t("searchTeams")}
        className="max-w-none md:max-w-[230px]"
      />

      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 md:justify-end">
        <button
          type="button"
          className={cn(
            "inline-flex h-[34px] items-center gap-2 rounded-[18px] border px-3 text-[12px] font-normal leading-[19px] md:text-[14px]",
            liveOnly
              ? "border-[rgba(123,202,37,0.45)] bg-[rgba(123,202,37,0.12)] text-[#7BCA25]"
              : "border-prophet-line bg-prophet-panel text-prophet-foreground dark:bg-[unset]"
          )}
          aria-pressed={liveOnly}
          onClick={() => {
            const next = !liveOnly;
            onLiveOnlyChange(next);
            if (next) {
              onShowEndedChange(false);
            }
          }}
        >
          <span
            className={cn(
              "size-[10px] shrink-0 rounded-full",
              liveOnly ? "bg-[#7BCA25]" : "bg-prophet-muted"
            )}
            aria-hidden
          />
          {t("liveMatches")}
        </button>

        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <Switch
            checked={showEnded}
            onCheckedChange={(checked) => {
              onShowEndedChange(checked);
              if (checked) {
                onLiveOnlyChange(false);
              }
            }}
            aria-label={t("showEndedMatches")}
          />
          <span className="whitespace-nowrap text-[12px] font-normal leading-[19px] text-prophet-foreground dark:text-prophet-muted md:text-[14px]">
            {t("showEnded")}
          </span>
        </label>
      </div>
    </div>
  );
}
