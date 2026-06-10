"use client";

import { cn } from "@/lib/cn";

export type MarketOtherSourceItem = {
  sourceName: string;
  netPercent: number;
};

function formatNetPercent(value: number) {
  return `NET ${value.toFixed(1)}%`;
}

function OtherSourcePill({ sourceName, netPercent }: MarketOtherSourceItem) {
  return (
    <div className="inline-flex h-[36px] shrink-0 items-center gap-2 rounded-[18px] border border-[#EBEBEB] bg-white px-3">
      <span className="text-[12px] font-[500] leading-[15px] text-[#909090]">
        {sourceName}
      </span>
      <span className="text-[12px] font-[500] leading-[15px] text-black">
        {formatNetPercent(netPercent)}
      </span>
    </div>
  );
}

export function MarketOtherSources({
  sources,
  className
}: {
  sources: MarketOtherSourceItem[];
  className?: string;
}) {
  if (!sources.length) {
    return null;
  }

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h4 className="m-0 text-[14px] font-[500] leading-[18px] text-[#909090]">
        Other Sources
      </h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <OtherSourcePill key={source.sourceName} {...source} />
        ))}
      </div>
    </section>
  );
}
