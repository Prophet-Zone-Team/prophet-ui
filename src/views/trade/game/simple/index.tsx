"use client";

import type {
  GameMarketSnapshot,
  GameMatchChartEvent,
  GameMatchMinuteHistoryPoint,
  TeamMarketSnapshot
} from "@/types/market";
import { GameSimpleHeader } from "@/views/trade/game/simple/game-simple-header";
import { GameSimpleMarketRow } from "@/views/trade/game/simple/game-simple-market-row";
import { GameSimpleProbabilitySection } from "@/views/trade/game/simple/game-simple-probability-section";
import { gameSimpleContentClass } from "@/views/trade/game/simple/game-simple-ui";

export interface TradeGameSimpleViewProps {
  snapshot: GameMarketSnapshot;
  matchMinuteHistory: GameMatchMinuteHistoryPoint[];
  chartEvents: GameMatchChartEvent[];
  teamSnapshots: TeamMarketSnapshot[];
}

export function TradeGameSimpleView({
  snapshot,
  matchMinuteHistory,
  chartEvents,
  teamSnapshots
}: TradeGameSimpleViewProps) {
  return (
    <div className="-mx-4 flex flex-col sm:-mx-6">
      <GameSimpleHeader snapshot={snapshot} teamSnapshots={teamSnapshots} />

      <div className={`${gameSimpleContentClass} pb-10`}>
        <GameSimpleMarketRow snapshot={snapshot} teamSnapshots={teamSnapshots} />
        <GameSimpleProbabilitySection
          minuteHistory={matchMinuteHistory}
          events={chartEvents}
        />
      </div>
    </div>
  );
}
