"use client";

"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { useMemo } from "react";

import { FastBidButton } from "@/components/trading/fast-bid-button";
import { trackDetailsClicked } from "@/lib/analytics/tracking";
import { teamDetailHref } from "@/lib/routes/team";
import { gameTradeHref, teamTradeHref } from "@/lib/routes/trade";
import { isTeamFastBidReady } from "@/lib/trading/run-fast-bid";
import {
  DEFAULT_FAST_BID_AMOUNT,
  useConfigHydrated,
  useFastBidAmount
} from "@/store";
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
  const fastBidAmount = useFastBidAmount();
  const hasHydrated = useConfigHydrated();
  const displayAmount = hasHydrated ? fastBidAmount : DEFAULT_FAST_BID_AMOUNT;
  const fastBidReady = useMemo(
    () => isTeamFastBidReady(snapshot, displayAmount),
    [snapshot, displayAmount]
  );

  const tradeHref = teamTradeHref(snapshot.market.slug || "");
  const detailHref = teamDetailHref(snapshot.team.id);

  return (
    <div
      className="flex w-full flex-wrap items-center gap-2 md:ml-auto md:w-[25%] md:shrink-0 justify-between md:justify-end"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <FastBidButton
        snapshot={snapshot}
        disabled={!fastBidReady}
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
      <Link
        href={detailHref}
        className={trackCardOutlineButtonClassName}
        onClick={() =>
          trackDetailsClicked({
            teamId: snapshot.team.id,
            teamName: snapshot.team.name,
            teamCode: snapshot.team.code,
            entrySource: "tracks_card",
            listName: "tracks_list",
            target: "team_detail"
          })
        }
      >
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
    </div>
  );
}
