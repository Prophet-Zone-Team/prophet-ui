"use client";

import { useTranslations } from "next-intl";

import { getScheduleRowVariant } from "@/lib/market/schedule-match";
import { cn } from "@/lib/cn";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useMatchWithLiveState } from "@/store/match-live-store";
import { gameColors } from "@/views/trade/game/ui";
import { GameTrackMetaBar, GameTrackTitle } from "./header/game-identity";
import { GameOutcomeRow } from "./header/game-outcome-row";
import { TrackCardFooter } from "./footer";
import { TrackCardShell } from "./shell";
import { trackCardOngoingShellClassName } from "./styles";
import type { TrackCardGameProps } from "./types";

function resolveSideProbability(
  sideTeamCode: string,
  probability: number,
  probabilityTeamCode: string,
  sideProbability: number | undefined
): number {
  if (sideProbability !== undefined) {
    return sideProbability;
  }

  return probabilityTeamCode === sideTeamCode ? probability : 0;
}

export function GameTrackCard({
  match,
  homeTeam,
  awayTeam,
  probability,
  probabilityTeamCode,
  volume,
  homeProbability,
  awayProbability,
  powerRanking,
  signals,
  signalItems,
  className
}: TrackCardGameProps) {
  const t = useTranslations("tracks");
  const homeDisplayName = useLocalizedTeamName(homeTeam.code, homeTeam.name);
  const awayDisplayName = useLocalizedTeamName(awayTeam.code, awayTeam.name);
  const liveMatch = useMatchWithLiveState(match);
  const title = `${homeDisplayName} vs ${awayDisplayName}`;
  const isOngoing = getScheduleRowVariant(liveMatch.status) === "ongoing";
  const showFooter = match.id.startsWith("fifwc-");
  const resolvedHomeProbability = resolveSideProbability(
    homeTeam.code,
    probability,
    probabilityTeamCode,
    homeProbability
  );
  const resolvedAwayProbability = resolveSideProbability(
    awayTeam.code,
    probability,
    probabilityTeamCode,
    awayProbability
  );

  return (
    <TrackCardShell
      className={cn(isOngoing && trackCardOngoingShellClassName, className)}
      headerClassName="gap-3 px-4 py-4 md:min-h-[196px] md:flex-col md:items-stretch md:justify-center md:gap-3"
      ariaLabel={t("matchTrackCardAria", { matchTitle: title })}
      header={
        <div className="flex w-full min-w-0 flex-col gap-3">
          <GameTrackMetaBar
            match={liveMatch}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            volume={volume}
          />
          <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <GameTrackTitle title={title} />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <GameOutcomeRow
                team={homeTeam}
                displayName={homeDisplayName}
                logoUrl={liveMatch.homeLogoUrl}
                probability={resolvedHomeProbability}
                barColor={gameColors.home}
              />
              <GameOutcomeRow
                team={awayTeam}
                displayName={awayDisplayName}
                logoUrl={liveMatch.awayLogoUrl}
                probability={resolvedAwayProbability}
                barColor={gameColors.awayBar}
              />
            </div>
          </div>
        </div>
      }
      footer={
        showFooter ? (
          <TrackCardFooter
            variant="game"
            signals={signals}
            powerRanking={powerRanking}
            signalItems={signalItems}
          />
        ) : undefined
      }
    />
  );
}
