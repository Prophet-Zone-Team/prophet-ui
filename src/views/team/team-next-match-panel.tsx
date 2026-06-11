"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import type { TeamMarketSnapshot } from "@/types/market";
import { formatFixtureDate, NextMatchView } from "@/lib/team/team-detail-model";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import { teamOpenTradeButtonClass } from "@/views/team/team-detail-ui";
import {
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface TeamNextMatchPanelProps {
  nextMatch?: NextMatchView;
  snapshot: TeamMarketSnapshot;
}

export function TeamNextMatchPanel({
  nextMatch,
  snapshot: _snapshot
}: TeamNextMatchPanelProps) {
  const t = useTranslations("teamDetail");

  return (
    <section className={teamPanelClass} aria-label={t("nextMatchAria")}>
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>{t("nextMatch")}</h2>
        <div className=""></div>
      </div>
      <div className="p-4">
        {nextMatch ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-col items-center gap-1">
                <TeamFlag name={nextMatch.homeTeamName} />
                <strong className="max-w-full truncate text-xs font-[500]">
                  {nextMatch.homeTeamName}
                </strong>
              </div>
              <span className="text-xs font-[500] text-prophet-muted">
                {t("versus")}
              </span>
              <div className="flex min-w-0 flex-col items-center gap-1">
                {nextMatch.awayTeamName ? (
                  <TeamFlag name={nextMatch.awayTeamName} />
                ) : (
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#f5f9ff] text-xs font-[500]">
                    {nextMatch.awayTeamName.slice(0, 2)}
                  </span>
                )}
                <strong className="max-w-full truncate text-xs font-[500]">
                  {nextMatch.awayTeamName}
                </strong>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-prophet-muted">
              {formatFixtureDate(nextMatch.fixtureDate)}
              {nextMatch.leagueName ? ` / ${nextMatch.leagueName}` : ""}
            </p>
            <Link
              href="/fifa/matches"
              className={`${teamOpenTradeButtonClass} mt-4 w-full`}
            >
              {t("viewMatch")}
            </Link>
          </>
        ) : (
          <TeamEmptyState
            title={t("nextMatchPending")}
            body={t("nextMatchPendingBody")}
          />
        )}
      </div>
    </section>
  );
}
