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
  "flex w-full max-w-[679px] items-center gap-[16px]";

export type SignalAllHeaderProps = {
  teamFilter: SignalAllTeamFilter;
  teamOptions: SignalAllTeamOption[];
  onTeamFilterChange: (value: SignalAllTeamFilter) => void;
  sort: SignalAllSortState;
  onSortColumnChange: (column: SignalAllSortColumn) => void;
  className?: string;
};

export function SignalAllHeader({
  teamFilter,
  teamOptions,
  onTeamFilterChange,
  sort,
  onSortColumnChange,
  className
}: SignalAllHeaderProps) {
  return (
    <header
      className={cn(
        "flex w-full max-w-[679px] flex-col p-[20px] pb-[0px]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[20px] font-[457] leading-[24px] text-black">
          All Signals &amp; News
        </h2>
        <SignalAllTeamFilterControl
          value={teamFilter}
          options={teamOptions}
          onChange={onTeamFilterChange}
        />
      </div>

      <div
        role="row"
        className={cn(
          signalAllListRowClass,
          "mt-[22px] text-[16px] font-[457] leading-[19px] text-[#909090]"
        )}
      >
        <SortableColumnHeader
          label="Team & Time"
          column="teamTime"
          sort={sort}
          onSortColumnChange={onSortColumnChange}
          className="w-[110px] shrink-0"
        />
        <span role="columnheader" className="min-w-0 flex-1 text-center">
          News
        </span>
        <SortableColumnHeader
          label="Impact"
          column="impact"
          sort={sort}
          onSortColumnChange={onSortColumnChange}
          className="shrink-0 justify-end"
          align="right"
        />
      </div>
    </header>
  );
}

function SortableColumnHeader({
  label,
  column,
  sort,
  onSortColumnChange,
  className,
  align = "left"
}: {
  label: string;
  column: SignalAllSortColumn;
  sort: SignalAllSortState;
  onSortColumnChange: (column: SignalAllSortColumn) => void;
  className?: string;
  align?: "left" | "right";
}) {
  const active = sort.column === column;
  const direction: SignalAllSortDirection = active ? sort.direction : "desc";

  return (
    <button
      type="button"
      role="columnheader"
      aria-sort={
        active
          ? sort.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className={cn(
        "inline-flex items-center gap-[6px] border-0 bg-transparent p-0 text-[16px] font-[457] leading-[19px] text-[#909090] hover:text-black",
        align === "right" && "justify-end",
        className
      )}
      onClick={() => onSortColumnChange(column)}
    >
      <span>{label}</span>
      <SignalAllSortIcon direction={direction} />
    </button>
  );
}
