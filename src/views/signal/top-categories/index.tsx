import { cn } from "@/lib/cn";

import { getCategoryPercentages } from "./format";
import { topCategoriesData } from "./mock-data";
import { TopCategoriesDonutChart } from "./top-categories-donut-chart";
import { TopCategoriesLegendRow } from "./top-categories-legend-row";
import type { TopCategoriesData } from "./types";

export type TopCategoriesProps = {
  data?: TopCategoriesData;
  className?: string;
};

export function TopCategories({
  data = topCategoriesData,
  className
}: TopCategoriesProps) {
  const percentages = getCategoryPercentages(data.categories);

  return (
    <section
      aria-label="Today's top categories"
      className={cn(
        "box-border flex h-[277px] w-full max-w-[696px] flex-col",
        "rounded-[12px] border border-[#EBEBEB] bg-white px-[20px] py-[20px]",
        className
      )}
    >
      <h2 className="m-0 shrink-0 text-[20px] font-[457] leading-[24px] text-black">
        Today&apos;s Top Categories
      </h2>

      <div className="mt-[20px] flex min-h-0 flex-1 items-center justify-between gap-[20px]">
        <div className="flex min-w-0 flex-1 flex-col">
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
          className="shrink-0"
        />
      </div>
    </section>
  );
}

export type { TopCategoriesData, SignalCategorySegment } from "./types";
