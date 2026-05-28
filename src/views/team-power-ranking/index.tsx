"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { useAnalyticsTeamPowerRankings } from "@/hooks/analytics/use-analytics-team-power-rankings";
import { PageBack } from "@/components/ui/page-back";

import { FullRankingTable } from "./full-ranking-table";
import {
  filterTeamPowerRankingEntries,
  getTeamFilterOptions
} from "./mock-data";
import { RankingFilterPill } from "./ranking-filter-pill";

export function TeamPowerRankingPage() {
  const { entries, isLoading, isError } = useAnalyticsTeamPowerRankings();
  const [teamFilter, setTeamFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const teamOptions = useMemo(
    () => getTeamFilterOptions(entries),
    [entries]
  );

  const groupOptions = useMemo(() => {
    const groups = [...new Set(entries.map((entry) => entry.group).filter(Boolean))].sort();
    return [
      { value: "all", label: "All" },
      ...groups.map((group) => ({ value: group, label: group }))
    ];
  }, [entries]);

  const filteredEntries = useMemo(
    () =>
      filterTeamPowerRankingEntries(entries, {
        teamId: teamFilter,
        group: groupFilter
      }),
    [entries, teamFilter, groupFilter]
  );

  return (
    <div className="mx-auto w-full max-w-[1408px] px-3 pb-8 md:px-4">
      <PageBack />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="m-0 pt-4 text-[22px] font-[457] leading-[26px] text-black md:pt-[20px] md:text-[26px] md:leading-[31px]">
          Team Power Ranking
        </h1>

        <div className="flex flex-wrap items-center gap-2 md:mt-5 md:gap-3">
          <RankingFilterPill
            prefix="Team"
            value={teamFilter}
            options={teamOptions}
            onChange={setTeamFilter}
          />
          <RankingFilterPill
            prefix="Group"
            value={groupFilter}
            options={groupOptions}
            onChange={setGroupFilter}
          />
        </div>
      </div>

      <div
        className={cn(
          "mt-4 box-border overflow-hidden rounded-[12px] md:mt-5",
          "border border-[#EBEBEB] bg-white pb-4 pt-4 md:pb-5 md:pt-5"
        )}
      >
        {isLoading ? (
          <p className="px-3 py-8 text-center text-[16px] leading-[19px] text-[#909090] md:px-5">
            Loading...
          </p>
        ) : isError ? (
          <p className="px-3 py-8 text-center text-[16px] leading-[19px] text-[#909090] md:px-5">
            Unable to load data.
          </p>
        ) : (
          <div className="md:overflow-x-auto">
            <FullRankingTable entries={filteredEntries} />
          </div>
        )}
      </div>
    </div>
  );
}
