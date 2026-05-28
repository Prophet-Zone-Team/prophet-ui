"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

import { FastBidButton } from "@/components/trading/fast-bid-button";
import { teamDetailHref } from "@/lib/routes/team";
import { gameTradeHref, teamTradeHref } from "@/lib/routes/trade";
import type { TeamMarketSnapshot } from "@/types/market";

import {
  trackCardBidButtonClassName,
  trackCardOutlineButtonClassName
} from "../styles";
import { cn } from "@/lib/cn";

export type TrackCardTeamActionsProps = {
  variant: "team";
  snapshot: TeamMarketSnapshot;
};

export type TrackCardGameActionsProps = {
  variant: "game";
  matchId: string;
};

export type TrackCardActionsProps =
  | TrackCardTeamActionsProps
  | TrackCardGameActionsProps;

export function TrackCardActions(props: TrackCardActionsProps) {
  if (props.variant === "game") {
    return <TrackCardGameActions variant="game" matchId={props.matchId} />;
  }

  return <TrackCardTeamActions variant="team" snapshot={props.snapshot} />;
}

function TrackCardTeamActions({ snapshot }: TrackCardTeamActionsProps) {
  const tradeHref = teamTradeHref(snapshot.team.id);
  const detailHref = teamDetailHref(snapshot.team.id);

  return (
    <div
      className="flex w-full flex-wrap items-center gap-2 md:ml-auto md:w-[25%] md:shrink-0 justify-between md:justify-end"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <FastBidButton
        snapshot={snapshot}
        className={cn(trackCardBidButtonClassName, "flex-1 md:flex-grow-0")}
      >
        <>
          <Zap
            className="h-3.5 w-2.5 shrink-0 fill-white stroke-white"
            aria-hidden
          />
          Bid
        </>
      </FastBidButton>
      <Link href={tradeHref} className={trackCardOutlineButtonClassName}>
        Trade
      </Link>
      <Link href={detailHref} className={trackCardOutlineButtonClassName}>
        Details
      </Link>
    </div>
  );
}

function TrackCardGameActions({ matchId }: TrackCardGameActionsProps) {
  const tradeHref = gameTradeHref(matchId);

  return (
    <div
      className="flex w-full flex-wrap items-center gap-2 md:ml-auto md:w-[25%] md:shrink-0 md:justify-end"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Link href={tradeHref} className={trackCardOutlineButtonClassName}>
        Trade
      </Link>
      <Link href={tradeHref} className={trackCardOutlineButtonClassName}>
        Details
      </Link>
    </div>
  );
}
