"use client";
import { cn } from "@/lib/cn";
import { PageBack } from "@/components/ui/page-back";

import { SignalAllList } from "./all-news";
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

export function SignalPage({
  data = signalPageData,
  className
}: SignalPageProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[1412px] px-4 pb-8", className)}>
      <PageBack />

      <section aria-label="Signal and news impact" className="pt-[20px]">
        <h1 className="m-0 text-[26px] font-[457] leading-[31px] text-black">
          Signal &amp; New Impact
        </h1>
        <div className="mt-[24px] grid grid-cols-3 gap-[19px]">
          {data.topImpactItems.map((item) => (
            <SignalTopCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section aria-label="All signals and news summary" className="mt-[20px]">
        <h2 className="m-0 text-[20px] font-[457] leading-[24px] text-black">
          All Signals &amp; News
        </h2>
        <div className="mt-[20px] grid grid-cols-4 gap-[21px]">
          {SUMMARY_VARIANTS.map(({ variant, countKey }) => (
            <SignalNewsItem
              key={variant}
              variant={variant}
              count={data.summary[countKey]}
            />
          ))}
        </div>
      </section>

      <div className="mt-[20px] flex items-start gap-[37px]">
        <SignalAllList className="w-[679px] shrink-0 rounded-[12px] p-[20px] border border-[#EBEBEB] bg-white" />

        <div className="flex w-[696px] shrink-0 flex-col gap-[20px]">
          <MostAffectedTeam />
          <TopCategories />
          <ImpactDistributionOverview />
        </div>
      </div>
    </div>
  );
}
