"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import type { ApiFootballFixtureContext, TeamMarketSnapshot } from "@/types/market";
import { formatFixtureDate } from "@/lib/team/team-detail-model";
import { TeamEmptyState } from "@/views/team/team-empty-state";
import {
  teamPanelBadgeClass,
  teamPanelClass,
  teamPanelHeadClass,
  teamPanelTitleClass
} from "@/views/team/team-detail-ui";

export interface DossierNextFixtureProps {
  fixture?: ApiFootballFixtureContext;
  snapshot: TeamMarketSnapshot;
}

export function DossierNextFixture({ fixture, snapshot }: DossierNextFixtureProps) {
  const t = useTranslations("teamDetail");

  return (
    <section className={teamPanelClass} aria-label={t("nextFixtureAria")}>
      <div className={teamPanelHeadClass}>
        <h2 className={teamPanelTitleClass}>{t("nextFixture")}</h2>
        <span className={teamPanelBadgeClass}>
          {fixture?.isWorldCupFixture ? t("worldCup") : t("schedule")}
        </span>
      </div>
      <div className="p-4">
        {fixture ? (
          <div className="text-center">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <TeamFlag code={snapshot.team.code} name={snapshot.team.name} />
                <strong className="text-xs font-[500]">
                  {snapshot.team.code}
                </strong>
              </div>
              <span className="text-[10px] font-[500] uppercase text-prophet-muted">
                {fixture.homeAway === "away" ? t("at") : t("versus")}
              </span>
              <div className="flex flex-col items-center gap-1">
                {fixture.opponentLogoUrl ? (
                  <img
                    src={fixture.opponentLogoUrl}
                    alt=""
                    className="size-9 rounded-full object-contain"
                  />
                ) : (
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#f5f9ff] text-xs font-[500] text-[#125afc]">
                    {fixture.opponentName.slice(0, 3)}
                  </span>
                )}
                <strong className="max-w-full truncate text-xs font-[500]">
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
            title={t("noOfficialFixture")}
            body={t("noOfficialFixtureBody")}
          />
        )}
      </div>
    </section>
  );
}
