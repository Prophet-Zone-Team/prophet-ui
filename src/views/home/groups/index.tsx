"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { useGroupStandings } from "@/hooks/market/use-group-standings";
import { useHomeContext } from "@/views/home/context";

import { GroupStandingsCard } from "./group-standings-card";
import { GroupStandingsSkeleton } from "./group-standings-skeleton";
import { filterGroupsBySearch } from "./utils";

export function HomeGroupsPanel() {
  const t = useTranslations("home");
  const { searchValue } = useHomeContext();
  const { groups: apiGroups, isLoading, isError } = useGroupStandings();

  const groups = useMemo(
    () => filterGroupsBySearch(apiGroups, searchValue),
    [apiGroups, searchValue],
  );

  if (isLoading) {
    return (
      <GroupStandingsSkeleton ariaLabel={t("loadingGroupStandingsAria")} />
    );
  }

  if (isError) {
    return (
      <div className="min-w-0 pb-4">
        <section
          className="min-w-0 rounded-xl border border-[#EBEBEB] bg-white px-4 py-8 text-center"
          aria-label={t("groupStandingsAria")}
        >
          <p className="m-0 text-sm text-[#909090]">
            {t("unableToLoadGroupStandings")}
          </p>
        </section>
      </div>
    );
  }

  if (apiGroups.length === 0) {
    return (
      <div className="min-w-0 pb-4">
        <section
          className="min-w-0 rounded-xl border border-[#EBEBEB] bg-white px-4 py-8 text-center"
          aria-label={t("groupStandingsAria")}
        >
          <p className="m-0 text-sm text-[#909090]">
            {t("noGroupStandingsAvailable")}
          </p>
        </section>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="min-w-0 pb-4">
        <section
          className="min-w-0 rounded-xl border border-[#EBEBEB] bg-white px-4 py-8 text-center"
          aria-label={t("groupStandingsAria")}
        >
          <p className="m-0 text-sm text-[#909090]">
            {t("noGroupsMatchSearch")}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-w-0 pb-4">
      <div
        className="flex flex-col gap-4"
        aria-label={t("groupStandingsAria")}
      >
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
