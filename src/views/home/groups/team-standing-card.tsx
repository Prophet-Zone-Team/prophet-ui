"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import type { WorldCup2026Group } from "@/data/world-cup-2026/groups";
import { cn } from "@/lib/cn";
import { groupDetailHref } from "@/lib/routes/group";
import type { GroupStandingRow } from "@/types/group-standings";

import { AdvancingProbabilityBar } from "./advancing-probability-bar";
import { AdvancingProbabilityPill } from "./advancing-probability-pill";
import { getGroupLabel, resolveGroupStandingRowTeamId } from "./utils";

export function TeamStandingCard({
  row,
  group,
  className
}: {
  row: GroupStandingRow;
  group: WorldCup2026Group;
  className?: string;
}) {
  const router = useRouter();
  const t = useTranslations("home");
  const groupLabel = getGroupLabel(group, t);

  const handleClick = useCallback(() => {
    router.push(
      groupDetailHref(group, {
        team: resolveGroupStandingRowTeamId(row),
        side: "yes"
      })
    );
  }, [group, row, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("groupStandingRowNavigateAria", {
        teamName: row.teamName,
        groupLabel
      })}
      className={cn(
        "flex w-full items-center gap-3 border-0 bg-transparent p-0 text-left transition-colors active:opacity-80",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <TeamFlag
            name={row.flagName}
            code={row.teamCode}
            logoUrl={row.logoUrl}
            className="h-6 w-6 text-[24px] shrink-0 rounded-[2px] drop-shadow-[0_0_2px_rgba(0,0,0,0.2)] text-2xl"
          />
          <span className="truncate text-[16px] leading-5 text-black">
            {row.teamName}
          </span>
        </div>
        <AdvancingProbabilityBar value={row.advancingProbability} />
      </div>
      <AdvancingProbabilityPill
        value={row.advancingProbability}
        className="h-9 min-w-[75px] shrink-0 px-3 text-[14px]"
      />
    </button>
  );
}
