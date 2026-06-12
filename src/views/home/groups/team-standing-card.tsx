"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import type { GroupStandingRow } from "@/types/group-standings";

import { AdvancingProbabilityPill } from "./advancing-probability-pill";
import { GROUP_STANDING_STAT_FIELDS } from "./config";

export function TeamStandingCard({
  row,
  className,
}: {
  row: GroupStandingRow;
  className?: string;
}) {
  const t = useTranslations("home");

  return (
    <article
      className={cn(
        "rounded-[8px] border border-[#EBEBEB] bg-white px-3 py-3 transition-colors active:bg-[#F9FAFC]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <TeamFlag
            name={row.flagName}
            code={row.teamCode}
            logoUrl={row.logoUrl}
            className="h-6 w-6 shrink-0 rounded-[2px] text-2xl"
          />
          <span className="truncate text-[16px] leading-normal text-black">
            {row.teamName}
          </span>
        </div>
        <AdvancingProbabilityPill
          value={row.advancingProbability}
          className="h-8 min-w-[88px] shrink-0 text-[13px]"
        />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2">
        {GROUP_STANDING_STAT_FIELDS.map((field) => (
          <div key={field.key} className="min-w-0">
            <dt className="text-[12px] leading-normal text-[#909090]">
              {t(field.labelKey)}
            </dt>
            <dd className="text-[14px] leading-normal text-black opacity-30">
              {row[field.key]}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
