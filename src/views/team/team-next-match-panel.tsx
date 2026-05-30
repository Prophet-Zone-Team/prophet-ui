import Link from "next/link";

import { TeamFlag } from "@/components/teams/team-flag";
import type { ApiFootballFixtureContext, TeamMarketSnapshot } from "@/types/market";
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
  snapshot
}: TeamNextMatchPanelProps) {
  return (
    <section className={teamPanelClass} aria-label="Next match">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Next Match</h2>
        <div className="">
        </div>
      </div>
      <div className="p-4">
        {nextMatch ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-col items-center gap-1">
                <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
                <strong className="max-w-full truncate text-xs font-[556]">
                  {snapshot.team.name}
                </strong>
              </div>
              <span className="text-xs font-[556] text-prophet-muted">vs</span>
              <div className="flex min-w-0 flex-col items-center gap-1">
                {nextMatch.awayTeamName ? (
                  <TeamFlag name={nextMatch.awayTeamName} />
                ) : (
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#f5f9ff] text-xs font-[556]">
                    {nextMatch.awayTeamName.slice(0, 2)}
                  </span>
                )}
                <strong className="max-w-full truncate text-xs font-[556]">
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
              View Match
            </Link>
          </>
        ) : (
          <TeamEmptyState
            title="Next match pending"
            body="Upcoming fixture data is not available for this team yet."
          />
        )}
      </div>
    </section>
  );
}
