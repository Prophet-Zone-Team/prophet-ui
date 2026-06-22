"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type { WorldCup2026GroupTeam } from "@/data/world-cup-2026/groups";
import { TeamFlag } from "@/components/teams/team-flag";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { Popover } from "@/components/popover";

import { buildTeamTooltipStats } from "../lib/team-tooltip-stats";

export function TeamHoverTooltip({
  team,
  winnerProbability,
  children
}: {
  team: WorldCup2026GroupTeam;
  winnerProbability?: number;
  children: ReactNode;
}) {
  const t = useTranslations("roadToFinal");
  const displayName = useLocalizedTeamName(team.code, team.name);
  const stats = buildTeamTooltipStats(team, winnerProbability);

  return (
    <Popover
      trigger="Hover"
      placement="Top"
      offset={10}
      triggerContainerClassName="flex h-full min-h-0 min-w-0 flex-1"
      contentStyle={{ pointerEvents: "none" }}
      content={
        <div className="w-[203px] rounded-[12px] border border-[#EBEBEB] bg-white p-[12px] shadow-[0_0_10px_rgba(0,0,0,0.1)]">
          <div className="flex items-start gap-[8px]">
            <TeamFlag
              code={team.code}
              name={team.name}
              className="h-[26px] w-[26px] shrink-0 rounded-[4px] text-[26px]"
            />
            <div className="min-w-0">
              <strong className="block truncate text-[14px] font-[500] text-black">
                {displayName}
              </strong>
              <span className="block text-[12px] text-black">
                {stats.teamCode} / {stats.confederation}
              </span>
            </div>
          </div>

          <dl className="mt-[12px] space-y-[8px]">
            <TooltipRow label={t("tooltipFifaRanking")} value={stats.fifaRankLabel} />
            <TooltipRow
              label={t("tooltipWinnerProbability")}
              value={stats.winnerProbabilityLabel}
            />
            <TooltipRow label={t("tooltipValue")} value={stats.valueLabel} />
            <TooltipRow
              label={t("tooltipTeamStrength")}
              value={stats.strengthLabel}
            />
          </dl>
        </div>
      }
    >
      {children}
    </Popover>
  );
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-[8px] text-[12px]">
      <dt className="text-[#909090]">{label}</dt>
      <dd className="m-0 text-right text-black">{value}</dd>
    </div>
  );
}
