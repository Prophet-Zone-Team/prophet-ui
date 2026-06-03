import { cn } from "@/lib/cn";

import { getImpactPercentages } from "./format";
import { ImpactDistributionBar } from "./impact-distribution-bar";
import { ImpactDistributionLegendItem } from "./impact-distribution-legend-item";
import { impactDistributionOverviewData } from "./mock-data";
import type { ImpactDistributionOverviewData } from "./types";

export type ImpactDistributionOverviewProps = {
  data?: ImpactDistributionOverviewData;
  className?: string;
};

export function ImpactDistributionOverview({
  data = impactDistributionOverviewData,
  className
}: ImpactDistributionOverviewProps) {
  const percentages = getImpactPercentages(data.segments);

  return (
    <section
      aria-label="Impact distribution overview"
      className={cn(
        "box-border flex h-auto w-full max-w-none flex-col md:h-[174px]",
        "rounded-[12px] border border-[#EBEBEB] bg-white px-3 py-4 md:px-5 md:py-5",
        className
      )}
    >
      <h2 className="m-0 text-lg font-[457] leading-[22px] text-black md:text-[20px] md:leading-[24px]">
        Impact Distribution Overview
      </h2>

      <div className="mt-4 md:mt-5">
        <ImpactDistributionBar segments={data.segments} />

        <div className="mt-3 flex flex-col gap-2 md:hidden">
          {data.segments.map((segment, index) => (
            <ImpactDistributionLegendItem
              key={segment.sentiment}
              sentiment={segment.sentiment}
              count={segment.count}
              percent={percentages[index] ?? 0}
            />
          ))}
        </div>

        <div className="mt-4 hidden gap-1 md:flex">
          {data.segments.map((segment, index) => (
            <div
              key={segment.sentiment}
              className="min-w-0"
              style={{
                width:
                  percentages[index] > 0
                    ? `${percentages[index]}%`
                    : `${100 / data.segments.length}%`
              }}
            >
              <ImpactDistributionLegendItem
                sentiment={segment.sentiment}
                count={segment.count}
                percent={percentages[index] ?? 0}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export type { ImpactDistributionOverviewData } from "./types";
