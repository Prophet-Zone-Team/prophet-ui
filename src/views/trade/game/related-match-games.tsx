"use client";

import Link from "next/link";

import { teamTradeHref } from "@/lib/routes/trade";
import { formatScheduleKickoff, resolveMatchSides } from "@/lib/market/schedule-match";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import {
  tradePanelClass,
  tradePanelTitleClass,
  tradeSectionClass
} from "@/views/trade/trade-widget/trade-ui";
import { RelatedGameCard } from "@/views/trade/related-game-card";

export interface RelatedMatchGamesProps {
  currentMatchId: string;
  matches: WorldCupMatch[];
  snapshots: TeamMarketSnapshot[];
}

export function RelatedMatchGames({
  currentMatchId,
  matches,
  snapshots
}: RelatedMatchGamesProps) {
  const related = matches.filter((match) => match.id !== currentMatchId).slice(0, 3);

  if (related.length === 0) {
    return null;
  }

  return (
    <section className={tradeSectionClass} aria-label="Related matches">
      <h2 className={`${tradePanelTitleClass} px-4 py-3`}>Related matches</h2>
      <div className="flex flex-col gap-3 px-4 pb-4">
        {related.map((match) => (
          <RelatedGameCard
            key={match.id}
            match={match}
            snapshots={snapshots}
            highlightTeamId={match.homeTeamId ?? ""}
          />
        ))}
      </div>
    </section>
  );
}

export interface MatchTeamLinksProps {
  match: WorldCupMatch;
  snapshots: TeamMarketSnapshot[];
}

export function MatchTeamLinks({ match, snapshots }: MatchTeamLinksProps) {
  const sides = resolveMatchSides(match, snapshots);

  return (
    <section className={tradePanelClass} aria-label="Team markets">
      <h2 className={`${tradePanelTitleClass} border-b border-prophet-line px-4 py-3`}>
        Team markets
      </h2>
      <div className="flex flex-col gap-2 px-4 py-4">
        {match.homeTeamId ? (
          <Link
            href={teamTradeHref(match.homeTeamId)}
            className="rounded-lg border border-prophet-line px-3 py-2 text-sm font-[556] text-black hover:border-prophet-green/50"
          >
            Trade {sides.home.name} winner
          </Link>
        ) : null}
        {match.awayTeamId ? (
          <Link
            href={teamTradeHref(match.awayTeamId)}
            className="rounded-lg border border-prophet-line px-3 py-2 text-sm font-[556] text-black hover:border-prophet-green/50"
          >
            Trade {sides.away.name} winner
          </Link>
        ) : null}
        <Link
          href="/matches"
          className="rounded-lg border border-prophet-line px-3 py-2 text-sm font-[556] text-[#909090] hover:text-black"
        >
          View full schedule · {formatScheduleKickoff(match.kickoffAt)}
        </Link>
      </div>
    </section>
  );
}
