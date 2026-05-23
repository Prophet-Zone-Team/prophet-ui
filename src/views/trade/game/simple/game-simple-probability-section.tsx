"use client";

import { useMemo, useState } from "react";

import {
  GAME_CHART_TIME_RANGES,
  type GameChartTimeRange
} from "@/lib/market/game-market-snapshot";
import type {
  GameMatchChartEvent,
  GameMatchMinuteHistoryPoint
} from "@/types/market";
import { GameSimpleProbabilityChart } from "@/views/trade/game/simple/game-simple-probability-chart";
import { gameSimpleCardClass } from "@/views/trade/game/simple/game-simple-ui";

export interface GameSimpleProbabilitySectionProps {
  minuteHistory: GameMatchMinuteHistoryPoint[];
  events: GameMatchChartEvent[];
}

export function GameSimpleProbabilitySection({
  minuteHistory,
  events
}: GameSimpleProbabilitySectionProps) {
  const [timeRange, setTimeRange] = useState<GameChartTimeRange>("1M");

  const filteredHistory = useMemo(() => {
    if (timeRange === "all") {
      return minuteHistory;
    }

    const limits: Record<Exclude<GameChartTimeRange, "all">, number> = {
      "1H": 2,
      "1D": 3,
      "1W": 5,
      "1M": minuteHistory.length
    };

    return minuteHistory.slice(-limits[timeRange]);
  }, [minuteHistory, timeRange]);

  return (
    <section className={`${gameSimpleCardClass} p-4 sm:p-5`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-[556] leading-6 text-black">Probability</h2>
        <div className="flex items-center gap-4 text-sm font-[556] leading-[17px]">
          {GAME_CHART_TIME_RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTimeRange(item.id)}
              className={
                timeRange === item.id
                  ? "border-0 bg-transparent text-black"
                  : "border-0 bg-transparent text-[#909090]"
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <GameSimpleProbabilityChart data={filteredHistory} events={events} />
    </section>
  );
}
