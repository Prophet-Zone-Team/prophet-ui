"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";

import {
  filterSignalAllItems,
  getNextSortState,
  getSignalAllTeamOptions,
  sortSignalAllItems
} from "./format";
import { SignalAllItem } from "./item";
import { SignalAllHeader } from "./signal-all-header";
import { signalAllNewsItems } from "./mock-data";
import type {
  SignalAllNewsItem,
  SignalAllSortState,
  SignalAllTeamFilter
} from "./types";

export type SignalAllListProps = {
  items?: SignalAllNewsItem[];
  className?: string;
};

const DEFAULT_SORT: SignalAllSortState = {
  column: "teamTime",
  direction: "desc"
};

export function SignalAllList({
  items = signalAllNewsItems,
  className
}: SignalAllListProps) {
  const [teamFilter, setTeamFilter] = useState<SignalAllTeamFilter>("all");
  const [sort, setSort] = useState<SignalAllSortState>(DEFAULT_SORT);

  const teamOptions = useMemo(() => getSignalAllTeamOptions(items), [items]);

  const visibleItems = useMemo(() => {
    const filtered = filterSignalAllItems(items, teamFilter);
    return sortSignalAllItems(filtered, sort);
  }, [items, sort, teamFilter]);

  return (
    <section
      aria-label="All signals and news"
      className={cn("flex w-full flex-col ", className)}
    >
      <SignalAllHeader
        teamFilter={teamFilter}
        teamOptions={teamOptions}
        onTeamFilterChange={setTeamFilter}
        sort={sort}
        onSortColumnChange={(column) => {
          setSort((current) => getNextSortState(current, column));
        }}
      />

      <div className="mt-[12px] flex flex-col">
        {visibleItems.length === 0 ? (
          <p className="py-8 text-center text-[16px] font-[457] leading-[19px] text-[#909090]">
            No signals match this team filter.
          </p>
        ) : (
          visibleItems.map((item) => (
            <SignalAllItem key={item.id} item={item} />
          ))
        )}
      </div>
    </section>
  );
}

export type { SignalAllNewsItem } from "./types";
