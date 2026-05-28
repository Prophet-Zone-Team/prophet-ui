"use client";

import { getScheduleRowVariant } from "@/lib/market/schedule-match";
import { cn } from "@/lib/cn";
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
  const liveMatch = useMatchWithLiveState(match);
  const title = `${homeTeam.name} vs ${awayTeam.name}`;
  const isOngoing = getScheduleRowVariant(liveMatch.status) === "ongoing";

  return (
    <TrackCardShell
      className={cn(isOngoing && trackCardOngoingShellClassName, className)}
      ariaLabel={`${title} track card`}
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
        <TrackCardFooter
          variant="game"
          signals={signals}
          powerRanking={powerRanking}
          signalItems={signalItems}
        />
      }
    />
  );
}
