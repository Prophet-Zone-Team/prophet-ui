"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { SyncMatchLiveStore } from "@/components/match/sync-match-live-store";
import { useFootballMatches } from "@/hooks/market/use-football-matches";
import { resolveLocalizedTeamName } from "@/lib/i18n/localized-team-name";
import {
  buildScheduleFilterTeams,
  buildScheduleMatchList,
  combineScheduleTeamFilterIds,
  resolveScheduleTeamSearchMatches,
  type ScheduleFilterTeam
} from "@/lib/market/schedule-match";
import { useScheduleMatchesWithLiveState } from "@/store/match-live-store";
import type { WorldCupMatch } from "@/types/market";
import { mapMatchToMarketItemProps } from "@/views/markets/content/map-match-to-market-item";
import { MarketItem } from "@/views/markets/content/market-item";
import type { MarketOddsOption } from "@/views/markets/content/market-item/types";
import { MarketsFilterBar } from "@/views/markets/content/markets-filter-bar";
import {
  MARKETS_NAV_ITEMS,
  type MarketsNavItemId
} from "@/views/markets/nav/config";

export interface MarketsContentProps {
  categoryId: MarketsNavItemId;
  selectedMatchId?: string | null;
  selectedOddsId?: string | null;
  onSelectMatchOdds?: (match: WorldCupMatch, option: MarketOddsOption) => void;
  onVisibleMatchesChange?: (matches: WorldCupMatch[]) => void;
  onActiveMatchChange?: (match: WorldCupMatch | null) => void;
}

function resolveNavLeague(categoryId: MarketsNavItemId): string {
  return (
    MARKETS_NAV_ITEMS.find((item) => item.id === categoryId)?.league ??
    categoryId
  );
}

function buildFilterTeams(matches: WorldCupMatch[]): ScheduleFilterTeam[] {
  return buildScheduleFilterTeams(matches, []);
}

export function MarketsContent({
  categoryId,
  selectedMatchId,
  selectedOddsId,
  onSelectMatchOdds,
  onVisibleMatchesChange,
  onActiveMatchChange
}: MarketsContentProps) {
  const tHome = useTranslations("home");
  const tNav = useTranslations("marketsNav");
  const [showEnded, setShowEnded] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const navItem = MARKETS_NAV_ITEMS.find((item) => item.id === categoryId);
  const league = resolveNavLeague(categoryId);
  const title = navItem ? tNav(navItem.labelKey) : categoryId;

  const footballMatchesQuery = useFootballMatches({
    league,
    ended: showEnded,
    enabled: league.trim().length > 0
  });

  const sourceMatches = footballMatchesQuery.matches;
  const matchesWithLive = useScheduleMatchesWithLiveState(sourceMatches);

  const scheduleFilterTeams = useMemo(
    () => buildFilterTeams(sourceMatches),
    [sourceMatches]
  );

  const tTeamNames = useTranslations("teamNames");

  const resolveTeamDisplayName = useCallback(
    (team: ScheduleFilterTeam) =>
      resolveLocalizedTeamName(team.code, team.name, tTeamNames),
    [tTeamNames]
  );

  const filteredTeamIds = useMemo(() => {
    const searchMatchedTeamIds = resolveScheduleTeamSearchMatches(
      scheduleFilterTeams,
      teamSearchQuery,
      resolveTeamDisplayName
    );

    return combineScheduleTeamFilterIds([], searchMatchedTeamIds);
  }, [resolveTeamDisplayName, scheduleFilterTeams, teamSearchQuery]);

  const listOptions = useMemo(
    () => ({
      showEnded,
      sortKey: "time" as const,
      teamIds: filteredTeamIds,
      liveOnly: false,
      skipEndedFilter: true
    }),
    [filteredTeamIds, showEnded]
  );

  const sortedMatches = useMemo(
    () => buildScheduleMatchList(matchesWithLive, [], listOptions),
    [listOptions, matchesWithLive]
  );

  useEffect(() => {
    onVisibleMatchesChange?.(sortedMatches);
  }, [onVisibleMatchesChange, sortedMatches]);

  useEffect(() => {
    if (!selectedMatchId) {
      onActiveMatchChange?.(null);
      return;
    }

    onActiveMatchChange?.(
      sortedMatches.find((match) => match.id === selectedMatchId) ?? null
    );
  }, [onActiveMatchChange, selectedMatchId, sortedMatches]);

  const handleSelectOdds = useCallback(
    (match: WorldCupMatch, option: MarketOddsOption) => {
      onSelectMatchOdds?.(match, option);
    },
    [onSelectMatchOdds]
  );

  return (
    <section className="min-w-0" aria-label={tNav("listAria")}>
      <SyncMatchLiveStore matches={sourceMatches} />

      <h1 className="m-0 text-[32px] font-[500] leading-[1.2] text-black dark:text-prophet-foreground">
        {title}
      </h1>

      <MarketsFilterBar
        teamSearchQuery={teamSearchQuery}
        showEnded={showEnded}
        onTeamSearchQueryChange={setTeamSearchQuery}
        onShowEndedChange={setShowEnded}
      />

      {footballMatchesQuery.isLoading && sortedMatches.length === 0 ? (
        <p className="m-0 text-sm text-[#909090]">{tHome("mobileLoadingAria")}</p>
      ) : sortedMatches.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sortedMatches.map((match) => (
            <MarketItem
              key={match.id}
              {...mapMatchToMarketItemProps(match)}
              selectedOddsId={
                selectedMatchId === match.id ? selectedOddsId : undefined
              }
              onSelectOdds={(option) => handleSelectOdds(match, option)}
            />
          ))}
        </div>
      ) : (
        <p className="m-0 text-sm text-[#909090]">
          {footballMatchesQuery.isFetching
            ? tHome("mobileLoadingAria")
            : tHome("noFixturesMatchFilters")}
        </p>
      )}
    </section>
  );
}
