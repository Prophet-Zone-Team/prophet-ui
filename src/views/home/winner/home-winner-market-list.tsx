"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import { resolveLocalizedTeamName } from "@/lib/i18n/localized-team-name";
import type { TeamMarketSnapshot } from "@/types/market";
import { useTeams } from "@/views/home/hooks/use-teams";
import { MarketListPanel } from "@/views/markets/market-list-panel";

export interface HomeWinnerMarketListProps {
  teams: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
}

export function HomeWinnerMarketList({
  teams,
  dataStatus
}: HomeWinnerMarketListProps) {
  const t = useTranslations("home");
  const tSignal = useTranslations("signal");
  const tTeamNames = useTranslations("teamNames");
  const { status, isLoading } = useTeams();
  const hasLiveValues = status === "ready";
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const resolveTeamDisplayName = useCallback(
    (snapshot: TeamMarketSnapshot) =>
      resolveLocalizedTeamName(
        snapshot.team.code,
        snapshot.team.name,
        tTeamNames
      ),
    [tTeamNames]
  );

  const filteredTeams = useMemo(() => {
    const normalizedQuery = teamSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return teams;
    }

    return teams.filter((snapshot) => {
      const displayName = resolveTeamDisplayName(snapshot).toLowerCase();

      return (
        displayName.includes(normalizedQuery) ||
        snapshot.team.code.toLowerCase().includes(normalizedQuery) ||
        snapshot.team.name.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [teams, teamSearchQuery, resolveTeamDisplayName]);

  const hasActiveSearch = teamSearchQuery.trim().length > 0;
  const showSearchEmptyState =
    hasActiveSearch && filteredTeams.length === 0 && teams.length > 0;

  return (
    <>
      {showSearchEmptyState ? (
        <p className="m-0 text-sm text-[#909090]">
          {tSignal("noTeamsMatchFilters")}
        </p>
      ) : (
        <MarketListPanel
          teams={filteredTeams}
          dataStatus={dataStatus}
          hasLiveValues={hasLiveValues}
          isLoading={isLoading}
          ariaLabel="All World Cup team markets"
          emptyState={
            <p className="m-0 text-sm text-[#909090]">
              {dataStatus.error ??
                "Live market data is unavailable. Check Polymarket connectivity and try again."}
            </p>
          }
        />
      )}
    </>
  );
}
