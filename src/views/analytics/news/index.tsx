import { cn } from "@/lib/cn";

import { signalNewsImpactData } from "./mock-data";
import { NewsHeader } from "./news-header";
import { NewsList } from "./news-list";
import { SignalSummaryBar } from "./signal-summary-bar";
import type { SignalNewsImpactData } from "./types";

export type SignalNewsImpactProps = {
  data?: SignalNewsImpactData;
  className?: string;
};

export function SignalNewsImpact({
  data = signalNewsImpactData,
  className
}: SignalNewsImpactProps) {
  return (
    <section
      aria-label="Signal and news impact"
      className={cn(
        "box-border flex h-[453px] w-full max-w-[696px] flex-col",
        "rounded-[12px] border border-[#EBEBEB] bg-white px-[20px] py-[20px]",
        className
      )}
    >
      <NewsHeader />
      <SignalSummaryBar summary={data.summary} className="mt-[16px]" />
      <div className="mt-[16px] min-h-0 flex-1 overflow-hidden">
        <NewsList items={data.items} />
      </div>
    </section>
  );
}
