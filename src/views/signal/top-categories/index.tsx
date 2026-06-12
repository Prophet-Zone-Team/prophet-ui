"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { getCategoryPercentages } from "./format";
import { topCategoriesData } from "./mock-data";
import { TopCategoriesDonutChart } from "./top-categories-donut-chart";
import { TopCategoriesLegendRow } from "./top-categories-legend-row";
import type { TopCategoriesData } from "./types";

export type TopCategoriesProps = {
  data?: TopCategoriesData;
  className?: string;
  isLoading?: boolean;
};

export function TopCategories({
  data = topCategoriesData,
  className,
  isLoading = false
}: TopCategoriesProps) {
  const t = useTranslations("signal");
  const percentages = getCategoryPercentages(data.categories);
  const isEmpty = !isLoading && data.categories.length === 0;

  return (
    <section
      aria-label={t("topCategoriesAria")}
      className={cn(
        "box-border flex h-auto w-full max-w-none flex-col md:h-[277px]",
        "rounded-[12px] border border-[#EBEBEB] bg-white px-3 py-4 md:px-5 md:py-5",
        className
      )}
    >
      <h2 className="m-0 shrink-0 text-lg font-[400] leading-[22px] text-black md:text-[20px] md:leading-[24px]">
        {t("topCategories")}
      </h2>

      {isLoading ? (
        <p className="mt-4 flex-1 text-[14px] text-[#909090]">{t("loading")}</p>
      ) : isEmpty ? (
        <p className="mt-4 flex flex-1 items-center justify-center py-8 text-center text-[14px] text-[#909090] md:text-[16px]">
          {t("noCategoryData")}
        </p>
      ) : (
        <div className="mt-4 flex min-h-0 flex-1 flex-col items-center gap-4 md:mt-5 md:flex-row md:items-center md:justify-between md:gap-5">
          <div className="flex w-full min-w-0 flex-1 flex-col">
            {data.categories.map((category, index) => (
              <TopCategoriesLegendRow
                key={category.id}
                category={category}
                percent={percentages[index] ?? 0}
                highlighted={index === 0}
              />
            ))}
          </div>

          <TopCategoriesDonutChart
            categories={data.categories}
            className="mx-auto shrink-0 md:mx-0"
          />
        </div>
      )}
    </section>
  );
}

export type { TopCategoriesData, SignalCategorySegment } from "./types";
