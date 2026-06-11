"use client";

import { useMemo } from "react";

import { getMockGroupStandings } from "@/data/mock/group-standings";
import { useHomeContext } from "@/views/home/context";

import { GroupStandingsCard } from "./group-standings-card";
import { filterGroupsBySearch } from "./utils";

export function HomeGroupsPanel() {
  const { searchValue } = useHomeContext();

  const groups = useMemo(
    () => filterGroupsBySearch(getMockGroupStandings(), searchValue),
    [searchValue],
  );

  if (groups.length === 0) {
    return (
      <div className="min-w-0 pb-4">
        <section
          className="min-w-0 rounded-xl border border-[#EBEBEB] bg-white px-4 py-8 text-center"
          aria-label="Group standings"
        >
          <p className="m-0 text-sm text-[#909090]">
            No groups match your search.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-w-0 pb-4">
      <div className="flex flex-col gap-4" aria-label="Group standings">
        {groups.map((groupStandings) => (
          <GroupStandingsCard
            key={groupStandings.group}
            group={groupStandings.group}
            rows={groupStandings.rows}
          />
        ))}
      </div>
    </div>
  );
}
