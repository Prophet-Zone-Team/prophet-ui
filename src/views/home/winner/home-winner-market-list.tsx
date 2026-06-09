"use client";

import type { MarketDataMeta } from "@/data/providers/types";
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
  const { status, isLoading } = useTeams();
  const hasLiveValues = status === "ready";

  return (
    <MarketListPanel
      teams={teams}
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
  );
}
