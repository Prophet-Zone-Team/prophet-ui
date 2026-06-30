"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

export type MarketOtherSourceItem = {
  sourceName: string;
  netPercent: number;
};

function OtherSourcePill({
  sourceName,
  netPercent,
  netPercentLabel
}: MarketOtherSourceItem & { netPercentLabel: string }) {
  return (
    <div className="inline-flex h-[36px] shrink-0 items-center gap-2 rounded-[18px] border border-prophet-line bg-prophet-panel px-3">
      <span className="text-[12px] font-[500] leading-[15px] text-[#909090]">
        {sourceName}
      </span>
      <span className="text-[12px] font-[500] leading-[15px] text-prophet-foreground">
        {netPercentLabel}
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
  const t = useTranslations("trade");

  if (!sources.length) {
    return null;
  }

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h4 className="m-0 text-[14px] font-[500] leading-[18px] text-[#909090]">
        {t("otherSources")}
      </h4>
      <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
        {sources.map((source) => (
          <OtherSourcePill
            key={source.sourceName}
            {...source}
            netPercentLabel={t("netPercent", {
              value: source.netPercent.toFixed(1)
            })}
          />
        ))}
      </div>
    </section>
  );
}
