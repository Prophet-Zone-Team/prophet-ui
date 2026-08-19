"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { HomeSearchInput } from "@/views/home/home-search-input";

export interface MarketsFilterBarProps {
  teamSearchQuery: string;
  showEnded: boolean;
  tierFilter?: string;
  tournamentFilter?: string;
  onTeamSearchQueryChange: (query: string) => void;
  onShowEndedChange: (value: boolean) => void;
}

const filterPillClassName =
  "box-border inline-flex h-[34px] shrink-0 items-center gap-2 rounded-[18px] border border-[#EBEBEB] bg-white px-3 text-[14px] font-[400] leading-[18px] text-black transition-opacity hover:opacity-80";

function MarketsFilterSwitch({
  checked,
  onCheckedChange,
  ariaLabel
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-4 w-[29px] shrink-0 rounded-lg border border-[#EAEAEA] transition-colors",
        checked ? "bg-[#222429]" : "bg-[#EBEBEB]"
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-[14px] -translate-y-1/2 rounded-lg border border-[#EAEAEA] bg-white transition-[left]",
          checked ? "left-[calc(100%-15px)]" : "left-0.5"
        )}
        aria-hidden
      />
    </button>
  );
}

function FilterDropdown({
  label,
  ariaLabel,
  className
}: {
  label: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        filterPillClassName,
        "min-w-[107px] justify-between",
        className
      )}
      aria-label={ariaLabel}
    >
      <span className="whitespace-nowrap">{label}</span>
      <ChevronDown className="size-2.5 shrink-0 text-black" aria-hidden />
    </button>
  );
}

export function MarketsFilterBar({
  teamSearchQuery,
  showEnded,
  tierFilter = "all",
  tournamentFilter = "all",
  onTeamSearchQueryChange,
  onShowEndedChange
}: MarketsFilterBarProps) {
  const t = useTranslations("marketsFilter");

  return (
    <div
      className="mb-3 mt-2 flex min-h-[34px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-3"
      role="toolbar"
      aria-label={t("filtersAria")}
    >
      <HomeSearchInput
        value={teamSearchQuery}
        onChange={onTeamSearchQueryChange}
        placeholder={t("searchPlaceholder")}
        ariaLabel={t("searchAria")}
        className="w-full max-w-none shrink-0 border-[#EBEBEB] bg-white lg:w-[230px] lg:max-w-[230px]"
        inputClassName="text-black placeholder:text-[#909090]"
      />

      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
        <FilterDropdown
          label={
            tournamentFilter === "all" ? t("allTournaments") : tournamentFilter
          }
          ariaLabel={t("allTournamentsAria")}
          className="min-w-[164px] justify-between"
        />

        <FilterDropdown
          label={tierFilter === "all" ? t("allTiers") : tierFilter}
          ariaLabel={t("allTiersAria")}
        />

        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <span className="whitespace-nowrap text-[14px] font-[400] leading-[18px] text-black">
            {t("showEnded")}
          </span>
          <MarketsFilterSwitch
            checked={showEnded}
            onCheckedChange={onShowEndedChange}
            ariaLabel={t("showEndedAria")}
          />
        </label>
      </div>
    </div>
  );
}
