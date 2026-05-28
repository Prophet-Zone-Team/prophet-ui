"use client";

import { useState } from "react";

import { Pagination } from "@/components/pagination/pagination";
import { cn } from "@/lib/cn";
import { ANALYTICS_NEWS_PAGE_SIZE } from "@/lib/analytics/config";
import { useAnalyticsNewsPage } from "@/hooks/analytics/use-analytics-news-page";

import { SignalAllItem } from "./item";
import { SignalAllHeader } from "./signal-all-header";
import type { SignalAllNewsItem } from "./types";

export type SignalAllListProps = {
  onItemSelect?: (item: SignalAllNewsItem) => void;
  className?: string;
};

export function SignalAllList({
  onItemSelect,
  className
}: SignalAllListProps) {
  const [page, setPage] = useState(1);
  const { items, total, pageSize, isLoading, isError } = useAnalyticsNewsPage(
    page,
    ANALYTICS_NEWS_PAGE_SIZE,
    ""
  );

  const teamOptions = [{ value: "all" as const, label: "All" }];

  return (
    <section
      aria-label="All signals and news"
      className={cn("flex w-full flex-col pb-4 md:pb-5", className)}
    >
      <SignalAllHeader
        teamFilter="all"
        teamOptions={teamOptions}
        onTeamFilterChange={() => undefined}
        sort={{ column: "teamTime", direction: "desc" }}
        onSortColumnChange={() => undefined}
        sortDisabled
        teamFilterDisabled
      />

      <div className="mt-3 flex flex-col gap-2 px-3 md:mt-[12px] md:gap-0 md:px-0">
        {isLoading ? (
          <p className="py-8 text-center text-[16px] font-[457] leading-[19px] text-[#909090]">
            Loading...
          </p>
        ) : isError ? (
          <p className="py-8 text-center text-[16px] font-[457] leading-[19px] text-[#909090]">
            Unable to load data.
          </p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-[16px] font-[457] leading-[19px] text-[#909090]">
            No signals available.
          </p>
        ) : (
          items.map((item) => (
            <SignalAllItem
              key={item.id}
              item={item}
              onSelect={onItemSelect ? () => onItemSelect(item) : undefined}
            />
          ))
        )}
      </div>

      {!isLoading && !isError && total > 0 ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      ) : null}
    </section>
  );
}

export type { SignalAllNewsItem } from "./types";
