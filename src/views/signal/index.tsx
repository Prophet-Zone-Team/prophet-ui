"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { PageBack } from "@/components/ui/page-back";
import type { NewsImpactItem } from "@/views/analytics/news/types";
import {
  getSignalNewsDetail,
  SignalNewsDetailDrawer
} from "@/views/signal/news-detail";

import { SignalAllList } from "./all-news";
import { signalAllNewsItems } from "./all-news/mock-data";
import { SignalNewsItem } from "./signals/item";
import { MostAffectedTeam } from "./most-affected-team";
import { ImpactDistributionOverview } from "./overview";
import { signalPageData } from "./mock-data";
import type { SignalPageData } from "./mock-data";
import { SignalTopCard } from "./top/card";
import { TopCategories } from "./top-categories";

export type SignalPageProps = {
  data?: SignalPageData;
  className?: string;
};

const SUMMARY_VARIANTS = [
  { variant: "today" as const, countKey: "todaySignal" as const },
  { variant: "positive" as const, countKey: "positive" as const },
  { variant: "negative" as const, countKey: "negative" as const },
  { variant: "high-impact" as const, countKey: "highImpact" as const }
];

function findNewsItemById(
  id: string,
  topItems: NewsImpactItem[],
  allItems: NewsImpactItem[]
): NewsImpactItem | null {
  return (
    topItems.find((item) => item.id === id) ??
    allItems.find((item) => item.id === id) ??
    null
  );
}

export function SignalPage({
  data = signalPageData,
  className
}: SignalPageProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(
    () =>
      selectedItemId
        ? findNewsItemById(
            selectedItemId,
            data.topImpactItems,
            signalAllNewsItems
          )
        : null,
    [data.topImpactItems, selectedItemId]
  );

  const selectedDetail = useMemo(
    () =>
      selectedItemId
        ? getSignalNewsDetail(selectedItemId, selectedItem ?? undefined)
        : null,
    [selectedItem, selectedItemId]
  );

  return (
    <div className={cn("mx-auto w-full max-w-[1412px] px-3 pb-8 md:px-4", className)}>
      <PageBack />

      <section aria-label="Signal and news impact" className="pt-4 md:pt-[20px]">
        <h1 className="m-0 text-[22px] font-[457] leading-[26px] text-black md:text-[26px] md:leading-[31px]">
          Signal &amp; New Impact
        </h1>
        <div className="mt-4 grid grid-cols-1 gap-3 md:mt-[24px] md:grid-cols-3 md:gap-[19px]">
          {data.topImpactItems.map((item) => (
            <SignalTopCard
              key={item.id}
              item={item}
              onSelect={() => setSelectedItemId(item.id)}
            />
          ))}
        </div>
      </section>

      <section aria-label="All signals and news summary" className="mt-5 md:mt-[20px]">
        <h2 className="m-0 text-lg font-[457] leading-[22px] text-black md:text-[20px] md:leading-[24px]">
          All Signals &amp; News
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:mt-[20px] md:grid-cols-4 md:gap-[21px]">
          {SUMMARY_VARIANTS.map(({ variant, countKey }) => (
            <SignalNewsItem
              key={variant}
              variant={variant}
              count={data.summary[countKey]}
            />
          ))}
        </div>
      </section>

      <div className="mt-5 flex flex-col items-stretch gap-5 md:mt-[20px] lg:flex-row lg:gap-[37px]">
        <SignalAllList
          className="min-w-0 w-full shrink-0 rounded-[12px] border border-[#EBEBEB] bg-white lg:w-[679px]"
          onItemSelect={(item) => setSelectedItemId(item.id)}
        />

        <div className="flex min-w-0 w-full flex-col gap-5 lg:w-[696px] lg:shrink-0">
          <MostAffectedTeam className="max-w-none" />
          <TopCategories className="max-w-none" />
          <ImpactDistributionOverview className="max-w-none" />
        </div>
      </div>

      <SignalNewsDetailDrawer
        open={selectedItemId !== null}
        detail={selectedDetail}
        onClose={() => setSelectedItemId(null)}
      />
    </div>
  );
}
