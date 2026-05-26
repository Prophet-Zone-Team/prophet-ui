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
        "box-border flex h-[174px] w-full max-w-[696px] flex-col",
        "rounded-[12px] border border-[#EBEBEB] bg-white px-[20px] py-[20px]",
        className
      )}
    >
      <h2 className="m-0 text-[20px] font-[457] leading-[24px] text-black">
        Impact Distribution Overview
      </h2>

      <div className="mt-[20px]">
        <ImpactDistributionBar segments={data.segments} />

        <div className="mt-[16px] flex gap-[4px]">
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
