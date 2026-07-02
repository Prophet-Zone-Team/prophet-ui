"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { TabSwitcher } from "@/components/ui/tab-switcher";
import { useAnalyticsHeadToHeadFixtures } from "@/hooks/analytics/use-analytics-head-to-head-fixtures";
import { useAnalyticsTeamRelatedNews } from "@/hooks/analytics/use-analytics-team-related-news";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import { useGameStatistics } from "@/hooks/market/use-game-statistics";
import { buildRelatedGamesTeamsQuery } from "@/lib/market/related-games-query";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type { TeamMarketSnapshot, WorldCupMatch } from "@/types/market";
import { MatchHistory } from "@/views/trade/game/match-history";
import { RelatedNews } from "@/views/trade/game/related-news";
import { GameStatistics } from "@/views/trade/game/statistics";
import { RelatedGames } from "@/views/trade/related-games";

const CONTEXT_TAB_IDS = ["related-games", "news", "history"] as const;

type ContextTabId = (typeof CONTEXT_TAB_IDS)[number];

export type MarketContextRowProps = {
  match: WorldCupMatch;
  teamSnapshots: TeamMarketSnapshot[];
  gameSnapshotHomeTeamId?: string;
};

export function MarketContextRow({
  match,
  teamSnapshots,
  gameSnapshotHomeTeamId
}: MarketContextRowProps) {
  const t = useTranslations("trade");
  const [tab, setTab] = useState<ContextTabId>("related-games");
  const [visitedTabs, setVisitedTabs] = useState<Set<ContextTabId>>(
    () => new Set(["related-games"])
  );

  const sides = useMemo(
    () => resolveMatchSides(match, teamSnapshots),
    [match, teamSnapshots]
  );

  const homeTeamName = sides.home.name;
  const awayTeamName = sides.away.name;
  const homeDisplayName = useLocalizedTeamName(sides.home.code, homeTeamName);
  const awayDisplayName = useLocalizedTeamName(sides.away.code, awayTeamName);

  const relatedGameTeamNames = useMemo(
    () =>
      [homeTeamName, awayTeamName].filter((name): name is string =>
        Boolean(name?.trim())
      ),
    [awayTeamName, homeTeamName]
  );

  const relatedGamesTeamsKey = buildRelatedGamesTeamsQuery(relatedGameTeamNames);
  const highlightTeamId =
    match.homeTeamId ??
    gameSnapshotHomeTeamId ??
    teamSnapshots[0]?.team.id ??
    "";

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

  const contextTabs = useMemo(
    () => [
      {
        id: "related-games" as const,
        label: t("relatedGames"),
        mobileLabel: t("tabRelatedGamesMobile")
      },
      {
        id: "news" as const,
        label: t("relatedNews"),
        mobileLabel: t("tabRelatedNewsMobile")
      },
      {
        id: "history" as const,
        label: t("matchHistory"),
        mobileLabel: t("tabMatchHistoryMobile")
      }
    ],
    [t]
  );

  const handleTabChange = useCallback((value: string) => {
    const nextTab = value as ContextTabId;
    setTab(nextTab);
    setVisitedTabs((current) => {
      if (current.has(nextTab)) {
        return current;
      }

      const next = new Set(current);
      next.add(nextTab);
      return next;
    });
  }, []);

  const showMobileContextTabs = relatedGamesTeamsKey.length > 0;

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

      {showMobileContextTabs ? (
        <div className="flex flex-col gap-0 overflow-hidden rounded-[12px] border border-prophet-line bg-prophet-panel md:hidden">
          <div className="border-b border-prophet-line px-3 pt-3">
            <TabSwitcher
              items={contextTabs}
              value={tab}
              onChange={handleTabChange}
              tabLabelClassName="text-[12px] leading-[17px] md:text-[16px] md:leading-[21px]"
              className="h-auto gap-3"
              aria-label={t("matchContextTabsAria")}
            />
          </div>

          {visitedTabs.has("related-games") ? (
            <div hidden={tab !== "related-games"}>
              <RelatedGames
                embedded
                teamNames={relatedGameTeamNames}
                highlightTeamId={highlightTeamId}
                excludeMatchId={match.id}
                snapshots={teamSnapshots}
              />
            </div>
          ) : null}
          {visitedTabs.has("news") ? (
            <div hidden={tab !== "news"}>
              <RelatedNews
                embedded
                items={relatedNewsItems}
                isLoading={relatedNewsLoading}
                isError={relatedNewsError}
              />
            </div>
          ) : null}
          {visitedTabs.has("history") ? (
            <div hidden={tab !== "history"}>
              <MatchHistory
                embedded
                matches={matchHistoryEntries}
                isLoading={matchHistoryLoading}
                isError={matchHistoryError}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:hidden">
          <RelatedNews
            items={relatedNewsItems}
            isLoading={relatedNewsLoading}
            isError={relatedNewsError}
          />
          <MatchHistory
            matches={matchHistoryEntries}
            isLoading={matchHistoryLoading}
            isError={matchHistoryError}
          />
        </div>
      )}

      <div className="hidden flex-col gap-4 md:flex lg:flex-row lg:items-start">
        <RelatedNews
          className="min-w-0 max-w-none flex-1"
          items={relatedNewsItems}
          isLoading={relatedNewsLoading}
          isError={relatedNewsError}
        />
        <MatchHistory
          className="min-w-0 max-w-none flex-1"
          matches={matchHistoryEntries}
          isLoading={matchHistoryLoading}
          isError={matchHistoryError}
        />
      </div>
    </div>
  );
}
