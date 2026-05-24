"use client";

import { useMemo, useState } from "react";

import {
  buildScheduleDateGroups,
  buildScheduleMatchList,
  type ScheduleSortKey
} from "@/lib/market/schedule-match";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { ScheduleFilterBar } from "@/views/home/matches/schedule-filter-bar";
import { ScheduleMatchRow } from "@/views/home/matches/schedule-match-row";
import { SpecialMatchDataCard } from "@/views/home/matches/special-match-data-card";

export interface HomeMatchesSchedulePanelProps {
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
}

export function HomeMatchesSchedulePanel({
  matches,
  snapshots
}: HomeMatchesSchedulePanelProps) {
  const [sortKey, setSortKey] = useState<ScheduleSortKey>("time");
  const [showEnded, setShowEnded] = useState(false);

  const sortedMatches = useMemo(
    () =>
      buildScheduleMatchList(matches, snapshots, {
        showEnded,
        sortKey
      }),
    [matches, snapshots, showEnded, sortKey]
  );

  const dateGroups = useMemo(
    () =>
      buildScheduleDateGroups(matches, snapshots, {
        showEnded,
        sortKey
      }),
    [matches, snapshots, showEnded, sortKey]
  );

  const featuredCard = useMemo(() => {
    const liveMatch = matches.find((match) => match.status === "live");

    if (!liveMatch) {
      return null;
    }

    return {
      match: liveMatch,
      home: liveMatch.homeTeamId
        ? snapshots.find((snapshot) => snapshot.team.id === liveMatch.homeTeamId)
        : undefined,
      away: liveMatch.awayTeamId
        ? snapshots.find((snapshot) => snapshot.team.id === liveMatch.awayTeamId)
        : undefined
    };
  }, [matches, snapshots]);

  return (
    <section className="min-w-0" aria-label="Football match schedule">
      {featuredCard ? (
        <div className="mb-3.5">
          <SpecialMatchDataCard
            match={featuredCard.match}
            home={featuredCard.home}
            away={featuredCard.away}
          />
        </div>
      ) : null}

      <ScheduleFilterBar
        sortKey={sortKey}
        showEnded={showEnded}
        onSortKeyChange={setSortKey}
        onShowEndedChange={setShowEnded}
      />

      {sortedMatches.length > 0 ? (
        dateGroups ? (
          <div className="flex flex-col gap-4">
            {dateGroups.map((group) => (
              <section key={group.dateKey} aria-label={group.label}>
                <h3 className="m-0 mb-2.5 text-base font-[556] leading-[19px] text-[#606060]">
                  {group.label}
                </h3>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {group.matches.map((match) => (
                    <li key={match.id}>
                      <ScheduleMatchRow match={match} snapshots={snapshots} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {sortedMatches.map((match) => (
              <li key={match.id}>
                <ScheduleMatchRow match={match} snapshots={snapshots} />
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="m-0 text-sm text-[#909090]">
          No fixtures match the current filters.
        </p>
      )}
    </section>
  );
}
