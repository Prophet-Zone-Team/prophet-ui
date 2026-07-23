"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { HomeSearchInput } from "@/views/home/home-search-input";

export interface ScheduleFilterBarProps {
  teamSearchQuery: string;
  liveOnly: boolean;
  week: number | null;
  weekOptions: number[];
  showEnded: boolean;
  onTeamSearchQueryChange: (query: string) => void;
  onLiveOnlyChange: (value: boolean) => void;
  onWeekChange: (week: number | null) => void;
  onShowEndedChange: (value: boolean) => void;
}

export function ScheduleFilterBar({
  teamSearchQuery,
  liveOnly,
  week,
  weekOptions,
  showEnded,
  onTeamSearchQueryChange,
  onLiveOnlyChange,
  onWeekChange,
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

        <WeekFilterDropdown
          week={week}
          weekOptions={weekOptions}
          onWeekChange={onWeekChange}
        />

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

function WeekFilterDropdown({
  week,
  weekOptions,
  onWeekChange
}: {
  week: number | null;
  weekOptions: number[];
  onWeekChange: (week: number | null) => void;
}) {
  const t = useTranslations("home");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (weekOptions.length === 0) {
    return null;
  }

  const label =
    week === null ? t("allWeeks") : t("weekLabel", { week });

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        className="inline-flex h-[34px] min-w-[113px] items-center justify-center gap-2 rounded-[18px] border border-prophet-line bg-prophet-panel px-3 text-[12px] font-normal leading-[19px] text-prophet-foreground dark:bg-[unset] md:text-[14px]"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        {label}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={cn("transition-transform", open && "rotate-180")}
          aria-hidden
        >
          <path
            d="M0.5 0.5L4.89223 4.5L9.5 0.5"
            stroke="currentColor"
            className="text-prophet-foreground"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 max-h-[240px] min-w-full overflow-y-auto rounded-xl border border-prophet-line bg-prophet-panel py-1 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
        >
          <li role="option" aria-selected={week === null}>
            <button
              type="button"
              className={cn(
                "flex w-full whitespace-nowrap px-3 py-2 text-left text-[14px]",
                week === null
                  ? "bg-prophet-hover font-medium text-prophet-foreground"
                  : "text-prophet-foreground hover:bg-prophet-hover"
              )}
              onClick={() => {
                onWeekChange(null);
                setOpen(false);
              }}
            >
              {t("allWeeks")}
            </button>
          </li>
          {weekOptions.map((option) => (
            <li key={option} role="option" aria-selected={week === option}>
              <button
                type="button"
                className={cn(
                  "flex w-full whitespace-nowrap px-3 py-2 text-left text-[14px]",
                  week === option
                    ? "bg-prophet-hover font-medium text-prophet-foreground"
                    : "text-prophet-foreground hover:bg-prophet-hover"
                )}
                onClick={() => {
                  onWeekChange(option);
                  setOpen(false);
                }}
              >
                {t("weekLabel", { week: option })}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
