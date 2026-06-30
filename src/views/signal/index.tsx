"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { PageBack } from "@/components/ui/page-back";
import { useAnalyticsLatestNews } from "@/hooks/analytics/use-analytics-latest-news";
import { useAnalyticsNewsTopCategoryImpact } from "@/hooks/analytics/use-analytics-news-top-category-impact";
import type { NewsImpactItem } from "@/views/analytics/news/types";
import {
  buildSignalNewsDetailFromImpactItem,
  getSignalNewsDetail
} from "@/views/signal/news-detail/format";
import { SignalNewsDetailDrawer } from "@/views/signal/news-detail/drawer";

import { SignalAllList } from "./all-news";
import { SignalNewsItem } from "./signals/item";
import { MostAffectedTeam } from "./most-affected-team";
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
];

export function SignalPage({
  data = signalPageData,
  className
}: SignalPageProps) {
  const t = useTranslations("signal");
  const { items: topImpactItems, isLoading: isTopLoading } =
    useAnalyticsLatestNews("");
  const {
    summary,
    topCategories,
    impactOverview,
    mostAffectedTeam,
    isLoading: isImpactLoading
  } = useAnalyticsNewsTopCategoryImpact();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [listItemsById, setListItemsById] = useState<
    Record<string, NewsImpactItem>
  >({});

  const handleListItemSelect = useCallback((item: NewsImpactItem) => {
    setListItemsById((current) => ({ ...current, [item.id]: item }));
    setSelectedItemId(item.id);
  }, []);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }

    return (
      topImpactItems.find((item) => item.id === selectedItemId) ??
      listItemsById[selectedItemId] ??
      null
    );
  }, [listItemsById, selectedItemId, topImpactItems]);

  const selectedDetail = useMemo(() => {
    if (!selectedItem) {
      return null;
    }

    return (
      buildSignalNewsDetailFromImpactItem(selectedItem) ??
      getSignalNewsDetail(selectedItem.id, selectedItem)
    );
  }, [selectedItem]);

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1412px] px-3 pb-8 md:px-4",
        className
      )}
    >
      <PageBack />

      <section
        aria-label={t("signalAndNewsImpact")}
        className="pt-4 md:pt-[20px]"
      >
        <h1 className="m-0 text-[22px] font-[400] leading-[26px] text-prophet-foreground md:text-[26px] md:leading-[31px]">
          {t("signalAndNewsImpact")}
        </h1>
        {isTopLoading ? (
          <p className="mt-4 py-8 text-center text-[14px] text-prophet-muted md:mt-[24px]">
            {t("loading")}
          </p>
        ) : topImpactItems.length === 0 ? (
          <p className="mt-4 py-8 text-center text-[14px] text-prophet-muted md:mt-[24px]">
            {t("noNewsAvailable")}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:mt-[24px] md:grid-cols-3 md:gap-[19px]">
            {topImpactItems.map((item) => (
              <SignalTopCard
                key={item.id}
                item={item}
                onSelect={() => setSelectedItemId(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section
        aria-label={t("allSignalsAndNewsAria")}
        className="mt-5 md:mt-[20px]"
      >
        <h2 className="m-0 text-lg font-[400] leading-[22px] text-prophet-foreground md:text-[20px] md:leading-[24px]">
          {t("allSignalsAndNews")}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:mt-[20px] md:grid-cols-3 md:gap-[21px]">
          {SUMMARY_VARIANTS.map(({ variant, countKey }) => (
            <SignalNewsItem
              key={variant}
              variant={variant}
              count={
                isImpactLoading
                  ? 0
                  : (summary[countKey] ?? data.summary[countKey])
              }
            />
          ))}
        </div>
      </section>

      <div className="mt-5 flex flex-col items-stretch gap-3 md:mt-[20px] lg:flex-row lg:gap-5">
        <SignalAllList
          className="min-w-0 w-full shrink-0 rounded-[12px] border border-prophet-line bg-prophet-panel lg:w-[679px]"
          onItemSelect={handleListItemSelect}
        />

        <div className="flex min-w-0 w-full flex-col gap-5 lg:flex-1">
          <MostAffectedTeam
            className="max-w-none"
            data={mostAffectedTeam}
            isLoading={isImpactLoading}
          />
          <TopCategories
            className="max-w-none"
            data={topCategories}
            isLoading={isImpactLoading}
          />
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
