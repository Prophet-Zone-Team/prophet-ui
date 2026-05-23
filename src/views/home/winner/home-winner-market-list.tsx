"use client";

import type { MarketDataMeta } from "../../../data/providers/types";
import type { TeamMarketSnapshot } from "../../../types/market";
import { MarketListPanel } from "../../markets/market-list-panel";

export interface HomeWinnerMarketListProps {
  teams: TeamMarketSnapshot[];
  dataStatus: MarketDataMeta;
}

export function HomeWinnerMarketList({ teams, dataStatus }: HomeWinnerMarketListProps) {
  return (
    <MarketListPanel
      teams={teams}
      dataStatus={dataStatus}
      ariaLabel="All World Cup team markets"
    />
  );
}
