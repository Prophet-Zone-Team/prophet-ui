"use client";

import { useRelatedGames } from "@/hooks/market/use-related-games";
import { buildRelatedGamesTeamsQuery } from "@/lib/market/related-games-query";
import type { TeamMarketSnapshot } from "@/types/market";
import { RelatedGameCard } from "@/views/trade/related-games/card";
import {
  tradeSectionClass,
  tradePanelTitleClass
} from "@/views/trade/trade-widget/trade-ui";

export interface RelatedGamesProps {
  teamNames: string[];
  highlightTeamId: string;
  snapshots: TeamMarketSnapshot[];
  excludeMatchId?: string;
}

function LoadingBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#ebebeb]/80 ${className ?? "h-4 w-full"}`}
      aria-hidden
    />
  );
}

function RelatedGamesLoading() {
  return (
    <div className="flex flex-col gap-3 px-3" aria-hidden>
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="rounded-xl border border-[#EBEBEB] bg-white p-3"
        >
          <LoadingBlock className="mb-2 h-4 w-24" />
          <LoadingBlock className="h-14 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function RelatedGames({
  teamNames,
  highlightTeamId,
  snapshots,
  excludeMatchId
}: RelatedGamesProps) {
  const teamsKey = buildRelatedGamesTeamsQuery(teamNames);
  const { matches, isLoading, isError } = useRelatedGames({
    teamNames,
    excludeMatchId,
    limit: 8
  });

  if (teamsKey.length === 0) {
    return null;
  }

  return (
    <section className={tradeSectionClass} aria-label="Related games">
      <h2 className={`${tradePanelTitleClass} px-4 py-3`}>Related Games</h2>

      {isLoading ? (
        <RelatedGamesLoading />
      ) : isError ? (
        <p className="px-4 py-8 text-center text-sm text-prophet-muted">
          Related games are unavailable right now.
        </p>
      ) : matches.length > 0 ? (
        <div className="flex flex-col gap-3 px-3">
          {matches.map((match) => (
            <RelatedGameCard
              key={match.id}
              match={match}
              snapshots={snapshots}
              highlightTeamId={highlightTeamId}
            />
          ))}
        </div>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-prophet-muted">
          No related fixtures are scheduled for this team yet.
        </p>
      )}
    </section>
  );
}
