"use client";

import { useMemo } from "react";

import { useAnalyticsHeadToHeadFixtures } from "@/hooks/analytics/use-analytics-head-to-head-fixtures";
import { useAnalyticsTeamRelatedNews } from "@/hooks/analytics/use-analytics-team-related-news";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useGameStatistics } from "@/hooks/market/use-game-statistics";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { MatchHistory } from "@/views/trade/game/match-history";
import { RelatedNews } from "@/views/trade/game/related-news";
import { GameStatistics } from "@/views/trade/game/statistics";

export type MarketContextRowProps = {
  match: WorldCupMatch;
  teamSnapshots: TeamMarketSnapshot[];
};

export function MarketContextRow({
  match,
  teamSnapshots
}: MarketContextRowProps) {
  const sides = useMemo(
    () => resolveMatchSides(match, teamSnapshots),
    [match, teamSnapshots]
  );

  const homeTeamName = sides.home.name;
  const awayTeamName = sides.away.name;
  const homeDisplayName = useLocalizedTeamName(sides.home.code, homeTeamName);
  const awayDisplayName = useLocalizedTeamName(sides.away.code, awayTeamName);

  const {
    items: relatedNewsItems,
    isLoading: relatedNewsLoading,
    isError: relatedNewsError
  } = useAnalyticsTeamRelatedNews({
    homeTeamName,
    awayTeamName
  });

  const {
    matches: matchHistoryEntries,
    isLoading: matchHistoryLoading,
    isError: matchHistoryError
  } = useAnalyticsHeadToHeadFixtures({
    teamA: homeTeamName,
    teamB: awayTeamName
  });

  const {
    rows: statisticsRows,
    isLoading: statisticsLoading,
    isError: statisticsError
  } = useGameStatistics({
    match,
    homeTeamName,
    awayTeamName
  });

  return (
    <div className="mt-[8px] flex flex-col gap-4">
      <GameStatistics
        homeTeam={{
          name: homeDisplayName,
          code: sides.home.code,
          logoUrl: sides.home.logoUrl
        }}
        awayTeam={{
          name: awayDisplayName,
          code: sides.away.code,
          logoUrl: sides.away.logoUrl
        }}
        rows={statisticsRows}
        isLoading={statisticsLoading}
        isError={statisticsError}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <RelatedNews
          className="min-w-0 flex-1 max-w-none"
          items={relatedNewsItems}
          isLoading={relatedNewsLoading}
          isError={relatedNewsError}
        />
        <MatchHistory
          className="min-w-0 flex-1 max-w-none"
          matches={matchHistoryEntries}
          isLoading={matchHistoryLoading}
          isError={matchHistoryError}
        />
      </div>
    </div>
  );
}
