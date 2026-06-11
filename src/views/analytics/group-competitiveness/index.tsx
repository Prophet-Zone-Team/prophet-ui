"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { useAnalyticsCompetitiveness } from "@/hooks/analytics/use-analytics-competitiveness";

import { CompetitivenessHeader } from "./competitiveness-header";
import { CompetitivenessSection } from "./competitiveness-section";

export type GroupCompetitivenessProps = {
  className?: string;
};

export function GroupCompetitiveness({ className }: GroupCompetitivenessProps) {
  const t = useTranslations("analytics");
  const { data, isLoading, isError } = useAnalyticsCompetitiveness();
  const { deathSection, easiestSection } = data;

  return (
    <article
      aria-label={t("groupCompetitivenessAria")}
      className={cn(
        "box-border flex h-auto w-full max-w-none flex-col md:h-[453px]",
        "rounded-[12px] border border-[#EBEBEB] bg-white",
        className
      )}
    >
      <CompetitivenessHeader />

      {isLoading ? (
        <p className="px-3 py-8 text-center text-[14px] text-[#909090] md:px-[25px]">
          {t("loading")}
        </p>
      ) : isError ? (
        <p className="px-3 py-8 text-center text-[14px] text-[#909090] md:px-[25px]">
          {t("unableToLoadData")}
        </p>
      ) : (
        <div className="mt-[16px] flex min-h-0 flex-1 flex-col">
          <CompetitivenessSection data={deathSection} />

          <div
            className="mx-3 border-t border-[#EBEBEB] md:mx-[25px]"
            role="separator"
            aria-hidden
          />

          <CompetitivenessSection data={easiestSection} />
        </div>
      )}
    </article>
  );
}
