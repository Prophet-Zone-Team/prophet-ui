"use client";

import type { MarketDataMeta } from "../../data/providers/types";
import type {
  GameMarketSnapshot,
  GameProbabilityHistoryPoint,
  TeamMarketSnapshot,
  WorldCupMatch
} from "../../types/market";
import { TradeGameProView } from "../../views/trade/game";

export interface GameTradePageProps {
  snapshot: GameMarketSnapshot;
  probabilityHistory: GameProbabilityHistoryPoint[];
  teamSnapshots: TeamMarketSnapshot[];
  relatedMatches: WorldCupMatch[];
  dataStatus: MarketDataMeta;
}

export function GameTradePage({
  snapshot,
  probabilityHistory,
  teamSnapshots,
  relatedMatches,
  dataStatus
}: GameTradePageProps) {
  return (
    <TradeGameProView
      snapshot={snapshot}
      probabilityHistory={probabilityHistory}
      teamSnapshots={teamSnapshots}
      relatedMatches={relatedMatches}
      dataStatus={dataStatus}
    />
  );
}
