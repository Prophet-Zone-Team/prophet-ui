"use client";

import { useTranslations } from "next-intl";

import type { FootballMatchesResult } from "@/data/providers/football-matches";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { homeEmptyStateClass } from "@/views/home/home-ui";
import { HomeMatchesSchedulePanel } from "@/views/home/matches/home-matches-schedule-panel";

export interface HomeMatchesPanelProps {
  matches: WorldCupMatch[];
  matchesMeta: FootballMatchesResult["meta"];
  /** Optional team winner snapshots; schedule rows use match display names when empty. */
  snapshots?: TeamMarketSnapshot[];
  /** When set (e.g. UEFA `ucol`), Show Ended refetches `/v1/games` with `ended`. */
  league?: string;
}

export function HomeMatchesPanel({
  matches,
  matchesMeta,
  snapshots = [],
  league
}: HomeMatchesPanelProps) {
  const t = useTranslations("home");

  if (matches.length === 0 && !league) {
    return (
      <div className="min-w-0 pb-4">
        <section
          className={homeEmptyStateClass}
          aria-label={t("footballMatchSchedule")}
        >
          <p className="m-0 text-sm text-prophet-muted">
            {matchesMeta.status === "unavailable"
              ? matchesMeta.source
              : t("noMatchMarketsAvailable")}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-w-0 pb-4">
      <HomeMatchesSchedulePanel
        matches={matches}
        snapshots={snapshots}
        league={league}
        matchesMeta={matchesMeta}
      />
    </div>
  );
}
