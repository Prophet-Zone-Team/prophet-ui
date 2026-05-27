"use client";

import { cn } from "@/lib/cn";

import { RelatedNewsRow } from "./item";
import { tradeGameRelatedNewsItems } from "./mock-data";
import type { RelatedNewsItem } from "./types";

export type RelatedNewsProps = {
  items?: RelatedNewsItem[];
  onItemSelect?: (item: RelatedNewsItem) => void;
  className?: string;
};

export function RelatedNews({
  items = tradeGameRelatedNewsItems,
  onItemSelect,
  className
}: RelatedNewsProps) {
  return (
    <section
      aria-label="Related news"
      className={cn(
        "w-full max-w-[531px] rounded-[12px] bg-white px-[16px] py-[16px]",
        "shadow-[0_0_10px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      <h2 className="m-0 text-[18px] font-[556] leading-[21px] text-black">
        Related News
      </h2>

      <div className="mt-[12px] flex flex-col gap-[4px]">
        {items.length === 0 ? (
          <p className="py-6 text-center text-[14px] font-[457] leading-[17px] text-[#909090]">
            No related news is available for this fixture yet.
          </p>
        ) : (
          items.map((item) => (
            <RelatedNewsRow
              key={item.id}
              item={item}
              onSelect={onItemSelect ? () => onItemSelect(item) : undefined}
            />
          ))
        )}
      </div>
    </section>
  );
}

export type { RelatedNewsItem } from "./types";
