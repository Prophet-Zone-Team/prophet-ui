"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { SignalAllSortIcon } from "./signal-all-sort-icon";
import { SignalAllTeamFilterControl } from "./signal-all-team-filter";
import type {
  SignalAllSortColumn,
  SignalAllSortDirection,
  SignalAllSortState,
  SignalAllTeamFilter,
  SignalAllTeamOption
} from "./types";

export const signalAllListRowClass =
  "flex w-full items-center gap-[16px]";

export type SignalAllHeaderProps = {
  teamFilter: SignalAllTeamFilter;
  teamOptions: SignalAllTeamOption[];
  onTeamFilterChange: (value: SignalAllTeamFilter) => void;
  sort: SignalAllSortState;
  onSortColumnChange: (column: SignalAllSortColumn) => void;
  teamFilterDisabled?: boolean;
  sortDisabled?: boolean;
  className?: string;
};

export function SignalAllHeader({
  teamFilter,
  teamOptions,
  onTeamFilterChange,
  sort,
  onSortColumnChange,
  teamFilterDisabled = false,
  sortDisabled = false,
  className
}: SignalAllHeaderProps) {
  const t = useTranslations("signal");

  return (
    <header
      className={cn(
        "flex w-full max-w-none flex-col px-3 pb-0 pt-4 md:p-5 md:pb-0",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 min-w-0 truncate text-lg font-[400] leading-[22px] text-black md:text-[20px] md:leading-[24px]">
          {t("allSignalsAndNews")}
        </h2>
        <SignalAllTeamFilterControl
          value={teamFilter}
          options={teamOptions}
          onChange={onTeamFilterChange}
          disabled={teamFilterDisabled}
          className="shrink-0"
        />
      </div>

      <div
        role="row"
        className={cn(
          signalAllListRowClass,
          "mt-4 hidden text-[16px] font-[400] leading-[19px] text-[#909090] md:flex md:mt-[22px]"
        )}
      >
        {/* <SortableColumnHeader
          label="Team & Time"
          column="teamTime"
          sort={sort}
          onSortColumnChange={onSortColumnChange}
          disabled={sortDisabled}
          className="w-[110px] shrink-0"
        /> */}
        <span role="columnheader" className="w-[110px] shrink-0">
          {t("teamAndTime")}
        </span>
        <span role="columnheader" className="min-w-0 flex-1 text-center">
          {t("news")}
        </span>
        <span role="columnheader" className="shrink-0 justify-end">
          {t("impact")}
        </span>
        {/* <SortableColumnHeader
          label="Impact"
          column="impact"
          sort={sort}
          onSortColumnChange={onSortColumnChange}
          disabled={sortDisabled}
          className="shrink-0 justify-end"
          align="right"
        /> */}
      </div>
    </header>
  );
}

function SortableColumnHeader({
  label,
  column,
  sort,
  onSortColumnChange,
  disabled = false,
  className,
  align = "left"
}: {
  label: string;
  column: SignalAllSortColumn;
  sort: SignalAllSortState;
  onSortColumnChange: (column: SignalAllSortColumn) => void;
  disabled?: boolean;
  className?: string;
  align?: "left" | "right";
}) {
  const active = sort.column === column;
  const direction: SignalAllSortDirection = active ? sort.direction : "desc";

  return (
    <button
      type="button"
      role="columnheader"
      disabled={disabled}
      aria-sort={
        active
          ? sort.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className={cn(
        "inline-flex items-center gap-[6px] border-0 bg-transparent p-0 text-[16px] font-[400] leading-[19px] text-[#909090]",
        !disabled && "hover:text-black",
        disabled && "cursor-not-allowed opacity-50",
        align === "right" && "justify-end",
        className
      )}
      onClick={() => {
        if (!disabled) {
          onSortColumnChange(column);
        }
      }}
    >
      <span>{label}</span>
      <SignalAllSortIcon direction={direction} />
    </button>
  );
}
