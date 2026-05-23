"use client";

import { useMemo, useState } from "react";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { formatMatchScore } from "@/lib/market/match-display";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import type {
  GameMatchChartEvent,
  GameMatchMinuteHistoryPoint,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { GameProbabilityChart } from "@/views/trade/game-probability/chart";

// TODO: Remove mock chart data once live game probability history is wired.
const MOCK_MINUTE_HISTORY: GameMatchMinuteHistoryPoint[] = [
  {
    matchId: "mock",
    minute: 8,
    minuteLabel: "8'",
    home: 35,
    draw: 32,
    away: 33
  },
  {
    matchId: "mock",
    minute: 15,
    minuteLabel: "15'",
    home: 36.5,
    draw: 31,
    away: 32.5
  },
  {
    matchId: "mock",
    minute: 23,
    minuteLabel: "23'",
    home: 38,
    draw: 30,
    away: 32
  },
  {
    matchId: "mock",
    minute: 30,
    minuteLabel: "30'",
    home: 39.5,
    draw: 29,
    away: 31.5
  },
  {
    matchId: "mock",
    minute: 45,
    minuteLabel: "45'",
    home: 40,
    draw: 28.5,
    away: 31.5
  },
  {
    matchId: "mock",
    minute: 60,
    minuteLabel: "60'",
    home: 41,
    draw: 28,
    away: 31
  },
  {
    matchId: "mock",
    minute: 75,
    minuteLabel: "75'",
    home: 41.5,
    draw: 28,
    away: 30.5
  },
  {
    matchId: "mock",
    minute: 90,
    minuteLabel: "90'",
    home: 42,
    draw: 28,
    away: 30
  }
];

const MOCK_CHART_EVENTS: GameMatchChartEvent[] = [
  { minute: 23, side: "home", type: "goal" },
  { minute: 60, side: "away", type: "goal" }
];

const GAME_PROBABILITY_TIME_RANGES = [
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "all", label: "All" }
] as const;

type GameProbabilityTimeRange =
  (typeof GAME_PROBABILITY_TIME_RANGES)[number]["id"];

const probabilityCardClass =
  "rounded-[12px] border border-[#EBEBEB] bg-white p-4 sm:p-5";

export interface GameProbabilitySectionProps {
  match?: WorldCupMatch;
  snapshots?: TeamMarketSnapshot[];
  minuteHistory?: GameMatchMinuteHistoryPoint[];
  events?: GameMatchChartEvent[];
  className?: string;
}

export function GameProbabilitySection({
  match,
  snapshots = [],
  minuteHistory,
  events,
  className
}: GameProbabilitySectionProps) {
  const [timeRange, setTimeRange] =
    useState<GameProbabilityTimeRange>("1M");

  const resolvedHistory = minuteHistory ?? MOCK_MINUTE_HISTORY;
  const resolvedEvents = events ?? MOCK_CHART_EVENTS;

  const filteredHistory = useMemo(
    () => filterMinuteHistoryByRange(resolvedHistory, timeRange),
    [resolvedHistory, timeRange]
  );

  const sides = match
    ? resolveMatchSides(match, snapshots)
    : undefined;
  const isLive = match?.status === "live";

  return (
    <section
      className={cn(probabilityCardClass, className)}
      aria-label="Match outcome probability"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="m-0 text-[20px] font-[556] leading-6 text-black">
          Probability
        </h2>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {isLive && match ? (
            <LiveScoreBadge
              homeCode={sides?.home.code}
              homeName={sides?.home.name ?? "Home"}
              awayCode={sides?.away.code}
              awayName={sides?.away.name ?? "Away"}
              score={formatMatchScore(match.homeScore, match.awayScore)}
            />
          ) : null}

          <div
            className="flex flex-wrap gap-4"
            role="group"
            aria-label="Chart time range"
          >
            {GAME_PROBABILITY_TIME_RANGES.map((range) => (
              <button
                key={range.id}
                type="button"
                className={cn(
                  "border-0 bg-transparent p-0 text-sm leading-[17px]",
                  timeRange === range.id
                    ? "font-[556] text-black"
                    : "font-[457] text-[#909090]"
                )}
                onClick={() => setTimeRange(range.id)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <GameProbabilityChart
          data={filteredHistory}
          events={resolvedEvents}
        />
      </div>
    </section>
  );
}

function LiveScoreBadge({
  homeCode,
  homeName,
  awayCode,
  awayName,
  score
}: {
  homeCode?: string;
  homeName: string;
  awayCode?: string;
  awayName: string;
  score: string;
}) {
  const [homeScore, awayScore] = score.split("-");

  return (
    <div className="flex items-center gap-3 text-sm font-[556] leading-[17px]">
      <span className="inline-flex items-center gap-1.5 text-[#65AF14]">
        <span
          className="size-2 rounded-full bg-[#65AF14]"
          aria-hidden
        />
        LIVE
      </span>

      <span className="inline-flex items-center gap-1.5 text-black">
        <TeamFlag
          code={homeCode}
          name={homeName}
          className="!h-4 !w-4 rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
        />
        {homeScore?.trim() ?? "—"}
      </span>

      <span className="inline-flex items-center gap-1.5 text-black">
        <TeamFlag
          code={awayCode}
          name={awayName}
          className="!h-4 !w-4 rounded-[2px] shadow-[0_0_2px_rgba(0,0,0,0.2)]"
        />
        {awayScore?.trim() ?? "—"}
      </span>
    </div>
  );
}

function filterMinuteHistoryByRange(
  history: GameMatchMinuteHistoryPoint[],
  range: GameProbabilityTimeRange
): GameMatchMinuteHistoryPoint[] {
  if (range === "all") {
    return history;
  }

  const limits: Record<Exclude<GameProbabilityTimeRange, "all">, number> = {
    "1D": history.length,
    "1W": history.length,
    "1M": history.length
  };

  return history.slice(-limits[range]);
}
