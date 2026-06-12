"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  buildSignalNewsDetailFromImpactItem,
  getSignalNewsDetail
} from "@/views/signal/news-detail/format";
import { SignalNewsDetailDrawer } from "@/views/signal/news-detail/drawer";

import { RelatedNewsRow } from "./item";
import type { RelatedNewsItem } from "./types";

export type RelatedNewsProps = {
  items?: RelatedNewsItem[];
  isLoading?: boolean;
  isError?: boolean;
  onItemSelect?: (item: RelatedNewsItem) => void;
  className?: string;
};

export function RelatedNews({
  items = [],
  isLoading = false,
  isError = false,
  onItemSelect,
  className
}: RelatedNewsProps) {
  const t = useTranslations("trade");
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

  const handleItemSelect = (item: RelatedNewsItem) => {
    setSelectedItemId(item.id);
    onItemSelect?.(item);
  };

  return (
    <>
      <section
        aria-label={t("relatedNewsAria")}
        className={cn(
          "w-full max-w-[531px] rounded-[12px] bg-white px-[16px] py-[16px]",
          "shadow-[0_0_10px_rgba(0,0,0,0.1)]",
          className
        )}
      >
        <h2 className="m-0 text-[18px] font-[500] leading-[21px] text-black">
          {t("relatedNews")}
        </h2>

        <div className="mt-[12px] flex flex-col gap-[4px]">
          {isLoading ? (
            <p className="py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090]">
              {t("loadingData")}
            </p>
          ) : isError ? (
            <p className="py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090]">
              {t("unableToLoadData")}
            </p>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-[14px] font-[400] leading-[17px] text-[#909090]">
              {t("relatedNewsEmpty")}
            </p>
          ) : (
            items.map((item) => (
              <RelatedNewsRow
                key={item.id}
                item={item}
                onSelect={handleItemSelect}
              />
            ))
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

export type { RelatedNewsItem } from "./types";
