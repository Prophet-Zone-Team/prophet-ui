"use client";

import { Search } from "lucide-react";
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
      <div className="mb-3 flex w-full min-w-0 items-center justify-between gap-[14px] md:hidden">
        <span className="shrink-0 text-[16px] font-[500] leading-[19px] text-[#000]">
          {tSignal("allTeamsFilter")}
        </span>
        <WinnerTeamSearchInput
          value={teamSearchQuery}
          onChange={setTeamSearchQuery}
          placeholder={t("searchTeams")}
        />
      </div>

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

function WinnerTeamSearchInput({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const t = useTranslations("home");

  return (
    <div className="relative min-w-0 shrink-0">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-[14px] -translate-y-1/2 text-[#222429]"
        strokeWidth={2}
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={t("searchTeams")}
        className="box-border h-[30px] w-[222px] max-w-[calc(100vw-8rem)] rounded-[18px] border border-[#EBEBEB] bg-white py-0 pl-[34px] pr-3 font-[Sora] text-[12px] font-normal leading-[15px] text-black outline-none placeholder:text-[#909090]"
      />
    </div>
  );
}
