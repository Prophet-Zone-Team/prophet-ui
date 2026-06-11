"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { cn } from "@/lib/cn";
import { formatNetImpact } from "./format";
import { mostAffectedTeamTableGridClass } from "./most-affected-team-table-header";
import type { MostAffectedTeamEntry } from "./types";

export type MostAffectedTeamTableRowProps = {
  entry: MostAffectedTeamEntry;
  className?: string;
};

export function MostAffectedTeamDesktopRow({ entry }: MostAffectedTeamTableRowProps) {
  const t = useTranslations("signal");
  const teamDisplayName = useLocalizedTeamName(entry.teamCode, entry.teamName);
  const isNegativeImpact = entry.netImpact < 0;
  const router = useRouter();

  return (
    <div
      role="row"
      className={cn(
        mostAffectedTeamTableGridClass,
        "items-center py-[10px] text-[16px] font-[400] leading-[19px] text-black cursor-pointer hover:bg-[#F0F2F5] duration-150"
      )}
      onClick={() => {
        if (entry.link) {
          router.push(entry.link);
        }
      }}
    >
      <span role="cell" className="tabular-nums">
        {entry.rank}
      </span>
      <div
        role="cell"
        className="flex min-w-0 items-center gap-[8px] overflow-hidden"
      >
        <TeamFlag
          code={entry.teamCode}
          name={entry.teamName}
          className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px]"
        />
        <span className="whitespace-nowrap flex-1 w-0 overflow-hidden text-ellipsis">
          {teamDisplayName}
        </span>
      </div>
      <span
        role="cell"
        className={cn(
          "tabular-nums",
          isNegativeImpact ? "text-[#FF674B]" : "text-black"
        )}
      >
        {formatNetImpact(entry.netImpact)}
      </span>
      <span role="cell" className="text-right tabular-nums">
        {entry.highImpactEventCount}
      </span>
    </div>
  );
}

export function MostAffectedTeamMobileCard({
  entry,
  className
}: MostAffectedTeamTableRowProps) {
  const t = useTranslations("signal");
  const teamDisplayName = useLocalizedTeamName(entry.teamCode, entry.teamName);
  const isNegativeImpact = entry.netImpact < 0;
  const router = useRouter();

  return (
    <article
      className={cn(
        "flex flex-col gap-2 rounded-[6px] px-3 py-3 text-[14px] font-[400] leading-[17px] text-black",
        className
      )}
      onClick={() => {
        if (entry.link) {
          router.push(entry.link);
        }
      }}
    >
      <div className="flex items-center gap-2">
        <span className="w-8 shrink-0 tabular-nums font-[500]">
          {entry.rank}
        </span>
        <TeamFlag
          code={entry.teamCode}
          name={entry.teamName}
          className="h-[20px] w-[20px] shrink-0 rounded-[4px] text-[20px]"
        />
        <span className="min-w-0 truncate font-[500]">{teamDisplayName}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-[#EBEBEB] pt-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] text-[#909090]">{t("netImpact")}</span>
          <span
            className={cn(
              "tabular-nums",
              isNegativeImpact ? "text-[#FF674B]" : "text-black"
            )}
          >
            {formatNetImpact(entry.netImpact)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[12px] text-[#909090]">
            {t("highImpactEvents")}
          </span>
          <span className="tabular-nums">{entry.highImpactEventCount}</span>
        </div>
      </div>
    </article>
  );
}
