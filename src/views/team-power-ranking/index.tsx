"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";

import { FullRankingTable } from "./full-ranking-table";
import {
  filterTeamPowerRankingEntries,
  getTeamFilterOptions,
  GROUP_FILTER_OPTIONS,
  teamPowerRankingEntries
} from "./mock-data";
import { RankingFilterPill } from "./ranking-filter-pill";
import { PageBack } from "@/components/ui/page-back";

export function TeamPowerRankingPage() {
  const [teamFilter, setTeamFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const teamOptions = useMemo(
    () => getTeamFilterOptions(teamPowerRankingEntries),
    []
  );

  const filteredEntries = useMemo(
    () =>
      filterTeamPowerRankingEntries(teamPowerRankingEntries, {
        teamId: teamFilter,
        group: groupFilter
      }),
    [teamFilter, groupFilter]
  );

  return (
    <div className="mx-auto w-full max-w-[1408px] px-4 pb-8">
      <PageBack />
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[26px] font-[457] leading-[31px] text-black  pt-[20px]">
          Team Power Ranking
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <RankingFilterPill
            prefix="Team"
            value={teamFilter}
            options={teamOptions}
            onChange={setTeamFilter}
          />
          <RankingFilterPill
            prefix="Group"
            value={groupFilter}
            options={[...GROUP_FILTER_OPTIONS]}
            onChange={setGroupFilter}
          />
        </div>
      </div>

      <div
        className={cn(
          "mt-5 box-border overflow-hidden rounded-[12px]",
          "border border-[#EBEBEB] bg-white pb-5 pt-5"
        )}
      >
        <div className="overflow-x-auto">
          <FullRankingTable entries={filteredEntries} />
        </div>
      </div>
    </div>
  );
}
