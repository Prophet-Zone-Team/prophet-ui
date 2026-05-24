"use client";

import type { MarketDataMeta } from "@/data/providers/types";
import type { TeamMarketSnapshot } from "@/types/market";
import { MarketListPanel } from "@/views/markets/market-list-panel";

export interface HomeWinnerMarketListProps {
  teams: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
}

export function HomeWinnerMarketList({
  teams,
  dataStatus
}: HomeWinnerMarketListProps) {
  return (
    <MarketListPanel
      teams={teams}
      dataStatus={dataStatus}
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
