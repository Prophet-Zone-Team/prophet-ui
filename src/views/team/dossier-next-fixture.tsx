import { TeamFlag } from "../../components/teams/team-flag";
import type { ApiFootballFixtureContext } from "../../types/market";
import type { TeamMarketSnapshot } from "../../types/market";
import { formatFixtureDate } from "../../lib/team/team-detail-model";
import { TeamEmptyState } from "./team-empty-state";
import {
  teamPanelBadgeClass,
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "./team-detail-ui";

export interface DossierNextFixtureProps {
  fixture?: ApiFootballFixtureContext;
  snapshot: TeamMarketSnapshot;
}

export function DossierNextFixture({ fixture, snapshot }: DossierNextFixtureProps) {
  return (
    <section className={teamPanelClass} aria-label="Next fixture">
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>Next Fixture</h2>
        <span className={teamPanelBadgeClass}>
          {fixture?.isWorldCupFixture ? "World Cup" : "Schedule"}
        </span>
      </div>
      <div className="p-4">
        {fixture ? (
          <div className="text-center">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
                <strong className="text-xs font-[556]">{snapshot.team.code}</strong>
              </div>
              <span className="text-[10px] font-[556] uppercase text-prophet-muted">
                {fixture.homeAway === "away" ? "at" : "vs"}
              </span>
              <div className="flex flex-col items-center gap-1">
                {fixture.opponentLogoUrl ? (
                  <img
                    src={fixture.opponentLogoUrl}
                    alt=""
                    className="size-9 rounded-full object-contain"
                  />
                ) : (
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#f5f9ff] text-xs font-[556] text-[#125afc]">
                    {fixture.opponentName.slice(0, 3)}
                  </span>
                )}
                <strong className="max-w-full truncate text-xs font-[556]">
                  {fixture.opponentName}
                </strong>
              </div>
            </div>
            <p className="m-0 mt-3 text-xs text-prophet-muted">
              {formatFixtureDate(fixture.kickoffAt)}
              {fixture.venueName ? ` / ${fixture.venueName}` : ""}
            </p>
          </div>
        ) : (
          <TeamEmptyState
            title="No official fixture"
            body="Upcoming fixture data is pending for this team."
          />
        )}
      </div>
    </section>
  );
}
