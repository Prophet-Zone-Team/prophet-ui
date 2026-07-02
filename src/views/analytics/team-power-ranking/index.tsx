"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { useAnalyticsTeamPowerRankings } from "@/hooks/analytics/use-analytics-team-power-rankings";
import { getTeamPowerRankingPreview } from "@/views/team-power-ranking/mock-data";

import { RankingHeader } from "./ranking-header";
import { RankingTable } from "./ranking-table";

export type TeamPowerRankingProps = {
  className?: string;
};

export function TeamPowerRanking({ className }: TeamPowerRankingProps) {
  const t = useTranslations("analytics");
  const { entries, isLoading, isError } = useAnalyticsTeamPowerRankings();
  const previewEntries = getTeamPowerRankingPreview(entries);

  return (
    <section
      aria-label={t("teamPowerRankingAria")}
      className={cn(
        "box-border flex h-auto min-h-0 w-full max-w-none flex-col md:h-[346px] md:max-w-[524px]",
        "rounded-[12px] border border-prophet-line bg-prophet-panel",
        className
      )}
    >
      <RankingHeader />
      <div className="mt-[16px] min-h-0 flex-1 overflow-hidden px-3 pb-4 md:px-0 md:pb-0">
        {isLoading ? (
          <p className="py-8 text-center text-[14px] text-prophet-muted">
            {t("loading")}
          </p>
        ) : isError ? (
          <p className="py-8 text-center text-[14px] text-prophet-muted">
            {t("unableToLoadData")}
          </p>
        ) : (
          <RankingTable entries={previewEntries} />
        )}
      </div>
    </section>
  );
}
