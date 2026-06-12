"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Pagination } from "@/components/pagination/pagination";
import { cn } from "@/lib/cn";
import { ANALYTICS_NEWS_PAGE_SIZE } from "@/lib/analytics/config";
import { useAnalyticsNewsPage } from "@/hooks/analytics/use-analytics-news-page";

import { getSignalAllTeamOptions } from "./format";
import { SignalAllItem } from "./item";
import { SignalAllHeader } from "./signal-all-header";
import type { SignalAllNewsItem, SignalAllTeamFilter } from "./types";

export type SignalAllListProps = {
  onItemSelect?: (item: SignalAllNewsItem) => void;
  className?: string;
};

export function SignalAllList({
  onItemSelect,
  className
}: SignalAllListProps) {
  const t = useTranslations("signal");
  const [page, setPage] = useState(1);
  const [teamFilter, setTeamFilter] = useState<SignalAllTeamFilter>("all");
  const teamOptions = useMemo(() => getSignalAllTeamOptions(), []);
  const teamsParam = teamFilter === "all" ? "" : teamFilter;

  const { items, total, pageSize, isLoading, isError } = useAnalyticsNewsPage(
    page,
    ANALYTICS_NEWS_PAGE_SIZE,
    "",
    teamsParam
  );

  return (
    <section
      aria-label={t("allSignalsAndNewsAria")}
      className={cn("flex w-full flex-col pb-4 md:pb-5", className)}
    >
      <SignalAllHeader
        teamFilter={teamFilter}
        teamOptions={teamOptions}
        onTeamFilterChange={(value) => {
          setTeamFilter(value);
          setPage(1);
        }}
        sort={{ column: "teamTime", direction: "desc" }}
        onSortColumnChange={() => undefined}
        sortDisabled
      />

      <div className="mt-3 flex flex-col gap-2 px-3 md:mt-[12px] md:gap-0 md:px-0">
        {isLoading ? (
          <p className="py-8 text-center text-[16px] font-[400] leading-[19px] text-[#909090]">
            {t("loading")}
          </p>
        ) : isError ? (
          <p className="py-8 text-center text-[16px] font-[400] leading-[19px] text-[#909090]">
            {t("unableToLoadData")}
          </p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-[16px] font-[400] leading-[19px] text-[#909090]">
            {t("noSignalsAvailable")}
          </p>
        ) : (
          items.map((item) => (
            <SignalAllItem
              teamFilter={teamFilter}
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
