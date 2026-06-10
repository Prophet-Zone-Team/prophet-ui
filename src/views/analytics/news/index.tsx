"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { useAnalyticsLatestNews } from "@/hooks/analytics/use-analytics-latest-news";
import {
  buildSignalNewsDetailFromImpactItem,
  getSignalNewsDetail
} from "@/views/signal/news-detail/format";
import { SignalNewsDetailDrawer } from "@/views/signal/news-detail/drawer";

import { NewsHeader } from "./news-header";
import { NewsList } from "./news-list";
import type { NewsImpactItem } from "./types";

export type SignalNewsImpactProps = {
  className?: string;
};

export function SignalNewsImpact({ className }: SignalNewsImpactProps) {
  const { items, isLoading, isError } = useAnalyticsLatestNews("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  const selectedDetail = useMemo(() => {
    if (!selectedItem) {
      return null;
    }

    return (
      buildSignalNewsDetailFromImpactItem(selectedItem) ??
      getSignalNewsDetail(selectedItem.id, selectedItem)
    );
  }, [selectedItem]);

  const handleItemSelect = (item: NewsImpactItem) => {
    setSelectedItemId(item.id);
  };

  return (
    <>
      <section
        aria-label="Signal and news impact"
        className={cn(
          "box-border flex h-auto w-full max-w-none flex-col md:h-[453px]",
          "rounded-[12px] border border-[#EBEBEB] bg-white px-3 py-4 md:px-[20px] md:py-[20px]",
          className
        )}
      >
        <NewsHeader />
        <div className="mt-[16px] min-h-0 flex-1 overflow-hidden">
          {isLoading ? (
            <p className="py-8 text-center text-[14px] text-[#909090]">
              Loading...
            </p>
          ) : isError ? (
            <p className="py-8 text-center text-[14px] text-[#909090]">
              Unable to load data.
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-[#909090]">
              No news available.
            </p>
          ) : (
            <NewsList items={items} onItemSelect={handleItemSelect} />
          )}
        </div>
      </section>

      <SignalNewsDetailDrawer
        open={selectedItemId !== null}
        detail={selectedDetail}
        onClose={() => setSelectedItemId(null)}
      />
    </>
  );
}
