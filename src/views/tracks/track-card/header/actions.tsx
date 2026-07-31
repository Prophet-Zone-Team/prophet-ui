"use client";

import Link from "next/link";
// Temporarily hide Bid on tracks until fast-bid is re-enabled.
// import { Zap } from "lucide-react";
// import { useMemo } from "react";
import { useTranslations } from "next-intl";

// Temporarily hide Bid on tracks until fast-bid is re-enabled.
// import { FastBidButton } from "@/components/trading/fast-bid-button";
import { trackDetailsClicked } from "@/lib/analytics/tracking";
import { teamDetailHref } from "@/lib/routes/team";
// Temporarily hide Trade on tracks until trading entry is re-enabled.
// import { gameTradeHref, teamTradeHref } from "@/lib/routes/trade";
// Temporarily hide Bid on tracks until fast-bid is re-enabled.
// import { isTeamFastBidReady } from "@/lib/trading/run-fast-bid";
// import {
//   DEFAULT_FAST_BID_AMOUNT,
//   useConfigHydrated,
//   useFastBidAmount
// } from "@/store";
import type { TeamMarketSnapshot } from "@/types/market";

import {
  // Temporarily hide Bid on tracks until fast-bid is re-enabled.
  // trackCardBidButtonClassName,
  trackCardOutlineButtonClassName
} from "../styles";
// Temporarily hide Bid on tracks until fast-bid is re-enabled.
// import { cn } from "@/lib/cn";

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
    // Temporarily hide Trade on tracks until trading entry is re-enabled.
    // return <TrackCardGameActions variant="game" matchId={props.matchId} />;
    return null;
  }

  return <TrackCardTeamActions variant="team" snapshot={props.snapshot} />;
}

function TrackCardTeamActions({ snapshot }: TrackCardTeamActionsProps) {
  const t = useTranslations("tracks");
  // Temporarily hide Bid on tracks until fast-bid is re-enabled.
  // const fastBidAmount = useFastBidAmount();
  // const hasHydrated = useConfigHydrated();
  // const displayAmount = hasHydrated ? fastBidAmount : DEFAULT_FAST_BID_AMOUNT;
  // const fastBidReady = useMemo(
  //   () => isTeamFastBidReady(snapshot, displayAmount),
  //   [snapshot, displayAmount]
  // );

  // Temporarily hide Trade on tracks until trading entry is re-enabled.
  // const tradeHref = teamTradeHref(snapshot.market.slug || "");
  const detailHref = teamDetailHref(snapshot.team.id);

  return (
    <div
      className="flex w-full flex-wrap items-center gap-2 md:ml-auto md:w-[25%] md:shrink-0 justify-between md:justify-end"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {/* Temporarily hide Bid on tracks until fast-bid is re-enabled.
      <FastBidButton
        snapshot={snapshot}
        disabled={!fastBidReady}
        className={cn(trackCardBidButtonClassName, "flex-1")}
      >
        <>
          <Zap
            className="h-3.5 w-2.5 shrink-0 fill-white stroke-white"
            aria-hidden
          />
          {t("bid")}
        </>
      </FastBidButton>
      */}
      {/* Temporarily hide Trade on tracks until trading entry is re-enabled.
      <Link href={tradeHref} className={trackCardOutlineButtonClassName}>
        {t("trade")}
      </Link>
      */}
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
        {t("details")}
      </Link>
    </div>
  );
}

// Temporarily hide Trade on tracks until trading entry is re-enabled.
// function TrackCardGameActions({ matchId }: TrackCardGameActionsProps) {
//   const t = useTranslations("tracks");
//   const tradeHref = gameTradeHref(matchId);
//
//   return (
//     <div
//       className="flex w-full flex-wrap items-center gap-2 md:ml-auto md:w-[25%] md:shrink-0 md:justify-end"
//       onClick={(event) => event.stopPropagation()}
//       onKeyDown={(event) => event.stopPropagation()}
//     >
//       <Link href={tradeHref} className={trackCardOutlineButtonClassName}>
//         {t("trade")}
//       </Link>
//     </div>
//   );
// }
