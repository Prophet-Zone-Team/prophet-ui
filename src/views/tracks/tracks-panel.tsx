"use client";

import Link from "next/link";
import { useMemo } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { useTrackedMatchIds, useTrackedTeamIds } from "@/store";
import { useTracksHydrated } from "@/store/use-tracks-hydrated";
import { MarketListPanel } from "@/views/markets/market-list-panel";
import { ScheduleMatchRow } from "@/views/home/matches/schedule-match-row";

export interface TracksPanelProps {
  snapshots: TeamMarketSnapshot[];
  matches: WorldCupMatch[];
  dataStatus: MarketDataMeta;
}

export function TracksPanel({ snapshots, matches, dataStatus }: TracksPanelProps) {
  const trackedTeamIds = useTrackedTeamIds();
  const trackedMatchIds = useTrackedMatchIds();
  const hasHydrated = useTracksHydrated();

  const trackedTeams = useMemo(() => {
    if (!hasHydrated || trackedTeamIds.length === 0) {
      return [];
    }

    const trackedIdSet = new Set(trackedTeamIds);

    return [...snapshots]
      .filter((snapshot) => trackedIdSet.has(snapshot.team.id))
      .sort((a, b) => b.market.probability - a.market.probability);
  }, [hasHydrated, snapshots, trackedTeamIds]);

  const trackedMatches = useMemo(() => {
    if (!hasHydrated || trackedMatchIds.length === 0) {
      return [];
    }

    const trackedIdSet = new Set(trackedMatchIds);

    return matches.filter((match) => trackedIdSet.has(match.id));
  }, [hasHydrated, matches, trackedMatchIds]);

  const isEmpty =
    hasHydrated &&
    trackedTeamIds.length === 0 &&
    trackedMatchIds.length === 0;

  if (isEmpty) {
    return <TracksEmptyState />;
  }

  return (
    <div className="flex flex-col gap-8">
      {trackedTeams.length > 0 ? (
        <section aria-label="Tracked World Cup team markets">
          <h2 className="m-0 mb-3 text-lg font-[556] leading-[21px] text-black">
            Teams
          </h2>
          <MarketListPanel
            teams={trackedTeams}
            dataStatus={dataStatus}
            ariaLabel="Tracked World Cup team markets"
          />
        </section>
      ) : null}

      {trackedMatches.length > 0 ? (
        <section aria-label="Tracked World Cup matches">
          <h2 className="m-0 mb-3 text-lg font-[556] leading-[21px] text-black">
            Matches
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {trackedMatches.map((match) => (
              <li key={match.id}>
                <ScheduleMatchRow match={match} snapshots={snapshots} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function TracksEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-[#EBEBEB] bg-white/70 px-6 py-10 text-center">
      <h2 className="m-0 text-lg font-[556] leading-[21px] text-black">
        Nothing tracked yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-[17px] text-[#667188]">
        Subscribe teams from the FIFA market list or bookmark matches from the
        schedule to see them here.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-[#909090] bg-white px-4 text-sm font-[556] leading-[17px] text-[#18110F]"
      >
        Go to FIFA markets
      </Link>
    </div>
  );
}
