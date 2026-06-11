import {
  formatAdvanceOdds,
  formatTitleProbability
} from "@/views/team-power-ranking/format";
import { TeamInfo } from "@/views/team-power-ranking/team-info";
import { TrendIndicator } from "@/views/team-power-ranking/trend-indicator";
import type { TeamPowerRankingEntry } from "@/views/team-power-ranking/types";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";

import { rankingPreviewTableGridClass } from "./table-grid";

export type RankingTableRowProps = {
  entry: TeamPowerRankingEntry;
};

export function RankingTableDesktopRow({ entry }: RankingTableRowProps) {
  const router = useRouter();

  return (
    <div
      role="row"
      className={cn(
        rankingPreviewTableGridClass,
        "px-[20px] py-[6px] text-[14px] font-[400] leading-[17px] text-black",
        entry.link ? "cursor-pointer hover:bg-[#EDEDED] duration-150" : "cursor-default",
      )}
      onClick={() => entry.link ? router.push(entry.link) : void 0}
    >
      <span role="cell">{entry.rank}</span>
      <div role="cell" className="min-w-0">
        <TeamInfo teamCode={entry.teamCode} teamName={entry.teamName} />
      </div>
      <span role="cell">{formatTitleProbability(entry.titleProbability)}</span>
      <span role="cell" className="text-center">
        {formatAdvanceOdds(entry.roundOf16Probability)}
      </span>
      <span role="cell" className="flex justify-center">
        <TrendIndicator trend={entry.trend} />
      </span>
    </div>
  );
}

export function RankingTableMobileCard({ entry }: RankingTableRowProps) {
  const t = useTranslations("analytics");
  const router = useRouter();

  return (
    <article
      className="flex flex-col gap-2 rounded-[6px] px-3 py-3 text-[14px] font-[400] leading-[17px] text-black"
      onClick={() => entry.link ? router.push(entry.link) : void 0}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="w-7 shrink-0 tabular-nums">{entry.rank}</span>
          <TeamInfo
            teamCode={entry.teamCode}
            teamName={entry.teamName}
            className="min-w-0"
          />
        </div>
        <TrendIndicator trend={entry.trend} />
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-[#EBEBEB] pt-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[12px] leading-[17px] text-[#909090]">
            {t("titleProbability")}
          </span>
          <span className="tabular-nums">
            {formatTitleProbability(entry.titleProbability)}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[12px] leading-[17px] text-[#909090]">
            {t("roundOf16")}
          </span>
          <span className="tabular-nums">
            {formatAdvanceOdds(entry.roundOf16Probability)}
          </span>
        </div>
      </div>
    </article>
  );
}
