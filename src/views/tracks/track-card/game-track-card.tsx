"use client";

import { useTranslations } from "next-intl";

import { getScheduleRowVariant } from "@/lib/market/schedule-match";
import { cn } from "@/lib/cn";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useMatchWithLiveState } from "@/store/match-live-store";
import { TrackCardActions } from "./header/actions";
import { GameIdentity } from "./header/game-identity";
import { GameStatsRow } from "./header/stats-row";
import { TrackCardFooter } from "./footer";
import { TrackCardShell } from "./shell";
import { trackCardOngoingShellClassName } from "./styles";
import type { TrackCardGameProps } from "./types";

export function GameTrackCard({
  match,
  homeTeam,
  awayTeam,
  probability,
  probabilityTeamCode,
  volume,
  powerRanking,
  signals,
  signalItems,
  youBid,
  className
}: TrackCardGameProps) {
  const t = useTranslations("tracks");
  const homeDisplayName = useLocalizedTeamName(homeTeam.code, homeTeam.name);
  const awayDisplayName = useLocalizedTeamName(awayTeam.code, awayTeam.name);
  const liveMatch = useMatchWithLiveState(match);
  const title = `${homeDisplayName} vs ${awayDisplayName}`;
  const isOngoing = getScheduleRowVariant(liveMatch.status) === "ongoing";
  const showFooter = match.id.startsWith("fifwc-");

  return (
    <TrackCardShell
      className={cn(isOngoing && trackCardOngoingShellClassName, className)}
      ariaLabel={t("matchTrackCardAria", { matchTitle: title })}
      header={
        <>
          <GameIdentity match={match} homeTeam={homeTeam} awayTeam={awayTeam} />
          <GameStatsRow
            probability={probability}
            probabilityTeamCode={probabilityTeamCode}
            volume={volume}
            youBid={youBid}
          />
          <TrackCardActions variant="game" matchId={match.id} />
        </>
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
