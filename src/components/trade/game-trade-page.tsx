"use client";

import { Suspense } from "react";

import type { MarketDataMeta } from "@/data/providers/types";
import type {
  GameMarketSnapshot,
  GameMatchChartEvent,
  GameMatchMinuteHistoryPoint,
  GameProbabilityHistoryPoint,
  TeamMarketSnapshot,
  TradeViewMode,
  WorldCupMatch
} from "@/types/market";
import { TradeGameProView } from "@/views/trade/game";
import { TradeGameSimpleView } from "@/views/trade/game/simple";
import { tradePageClass } from "@/views/trade/trade-widget/trade-ui";

export interface GameTradePageProps {
  mode: TradeViewMode;
  snapshot: GameMarketSnapshot;
  probabilityHistory: GameProbabilityHistoryPoint[];
  matchMinuteHistory: GameMatchMinuteHistoryPoint[];
  chartEvents: GameMatchChartEvent[];
  teamSnapshots: TeamMarketSnapshot[];
  relatedMatches: WorldCupMatch[];
  dataStatus: MarketDataMeta;
}

export function GameTradePage({
  mode,
  snapshot,
  probabilityHistory,
  matchMinuteHistory,
  chartEvents,
  teamSnapshots,
  relatedMatches,
  dataStatus
}: GameTradePageProps) {
  return (
    <div className={tradePageClass}>
      {mode === "simple" ? (
        <TradeGameSimpleView
          snapshot={snapshot}
          matchMinuteHistory={matchMinuteHistory}
          chartEvents={chartEvents}
          teamSnapshots={teamSnapshots}
        />
      ) : (
        <TradeGameProView
          snapshot={snapshot}
          probabilityHistory={probabilityHistory}
          teamSnapshots={teamSnapshots}
          relatedMatches={relatedMatches}
          dataStatus={dataStatus}
          embedded
        />
      )}
    </div>
  );
}
