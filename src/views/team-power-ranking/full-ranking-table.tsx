import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { FullRankingTableHeader } from "./full-ranking-table-header";
import {
  FullRankingDesktopRow,
  FullRankingMobileCard
} from "./full-ranking-table-row";
import {
  getAdvanceOddsMax,
  getTitleOddsMax
} from "./mock-data";
import type { TeamPowerRankingEntry } from "./types";

export type FullRankingTableProps = {
  entries: TeamPowerRankingEntry[];
  className?: string;
};

export function FullRankingTable({ entries, className }: FullRankingTableProps) {
  const t = useTranslations("analytics");
  const titleOddsMax = getTitleOddsMax(entries);
  const advanceOddsMax = getAdvanceOddsMax(entries);
  const tableLabel = t("teamPowerRankingAria");

  if (entries.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-[16px] leading-[19px] text-[#909090] md:px-5">
        {t("noTeamsMatchFilters")}
      </p>
    );
  }

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div
        role="table"
        aria-label={tableLabel}
        className="hidden w-full flex-col md:flex"
      >
        <FullRankingTableHeader />
        <div className="mt-3 flex flex-col">
          {entries.map((entry) => (
            <FullRankingDesktopRow
              key={entry.id}
              entry={entry}
              titleOddsMax={titleOddsMax}
              advanceOddsMax={advanceOddsMax}
            />
          ))}
        </div>
      </div>

      <div
        className="flex flex-col gap-2 md:hidden"
        aria-label={tableLabel}
      >
        {entries.map((entry, index) => (
          <FullRankingMobileCard
            key={entry.id}
            entry={entry}
            titleOddsMax={titleOddsMax}
            advanceOddsMax={advanceOddsMax}
            className={index % 2 === 0 ? "bg-[#F9FAFC]" : "bg-white"}
          />
        ))}
      </div>
    </div>
  );
}
