"use client";

import { useMemo } from "react";

import { useAnalyticsHeadToHeadFixtures } from "@/hooks/analytics/use-analytics-head-to-head-fixtures";
import { useAnalyticsTeamRelatedNews } from "@/hooks/analytics/use-analytics-team-related-news";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { MatchHistory } from "@/views/trade/game/match-history";
import { RelatedNews } from "@/views/trade/game/related-news";

export type MarketContextRowProps = {
  match: WorldCupMatch;
  teamSnapshots: TeamMarketSnapshot[];
  defaultTeamId?: string;
};

export function MarketContextRow({
  match,
  teamSnapshots,
  defaultTeamId
}: MarketContextRowProps) {
  const sides = useMemo(
    () => resolveMatchSides(match, teamSnapshots),
    [match, teamSnapshots]
  );

  const homeTeamName = sides.home.name;
  const awayTeamName = sides.away.name;

  const {
    items: relatedNewsItems,
    isLoading: relatedNewsLoading,
    isError: relatedNewsError
  } = useAnalyticsTeamRelatedNews({
    homeTeamName,
    awayTeamName
  });

  const homeSide = useMemo(
    () => ({
      id: match.homeTeamId ?? "home",
      name: homeTeamName,
      code: sides.home.code
    }),
    [match.homeTeamId, homeTeamName, sides.home.code]
  );

  const awaySide = useMemo(
    () => ({
      id: match.awayTeamId ?? "away",
      name: awayTeamName,
      code: sides.away.code
    }),
    [match.awayTeamId, awayTeamName, sides.away.code]
  );

  const {
    teams: matchHistoryTeams,
    isLoading: matchHistoryLoading,
    isError: matchHistoryError
  } = useAnalyticsHeadToHeadFixtures({
    teamA: homeTeamName,
    teamB: awayTeamName,
    homeSide,
    awaySide
  });

  return (
    <div className="mt-[8px] flex flex-col gap-4 lg:flex-row lg:items-start">
      <RelatedNews
        className="min-w-0 flex-1 max-w-none"
        items={relatedNewsItems}
        isLoading={relatedNewsLoading}
        isError={relatedNewsError}
      />
      <MatchHistory
        className="min-w-0 flex-1 max-w-none"
        teams={matchHistoryTeams}
        defaultTeamId={defaultTeamId}
        isLoading={matchHistoryLoading}
        isError={matchHistoryError}
      />
    </div>
  );
}
