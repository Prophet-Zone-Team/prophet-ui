"use client";

import { useMemo, useState } from "react";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { findGameMarketOutcome } from "@/lib/market/game-outcome-price";
import { formatMatchScore } from "@/lib/market/match-display";
import { resolveMatchSides } from "@/lib/market/schedule-match";
import { useTradeMatchOutcomeSide } from "@/store/trade-ticket-store";
import type {
  GameFixtureChartTimeRange,
  GameMarketSnapshot,
  TeamMarketSnapshot,
  WorldCupMatch
} from "@/types/market";
import { Orderbook } from "@/views/trade/team/orderbook";
import { GameProbabilityChart } from "@/views/trade/game-probability/chart";
import { useFixturePriceHistory } from "@/views/trade/game-probability/use-fixture-price-history";

const GAME_PROBABILITY_TIME_RANGES = [
  { id: "1D", label: "1D" },
  { id: "1W", label: "1W" },
  { id: "1M", label: "1M" },
  { id: "all", label: "All" }
] as const satisfies ReadonlyArray<{
  id: GameFixtureChartTimeRange;
  label: string;
}>;

const probabilityCardClass =
  "min-w-0 flex-1 rounded-[12px] border border-[#EBEBEB] bg-white p-4 sm:p-5";

export interface GameProbabilitySectionProps {
  match: WorldCupMatch;
  snapshots?: TeamMarketSnapshot[];
  gameSnapshot?: GameMarketSnapshot;
  showOrderbook?: boolean;
  className?: string;
}

export function GameProbabilitySection({
  match,
  snapshots = [],
  gameSnapshot,
  showOrderbook = false,
  className
}: GameProbabilitySectionProps) {
  const [timeRange, setTimeRange] = useState<GameFixtureChartTimeRange>("all");
  const matchOutcomeSide = useTradeMatchOutcomeSide();
  const { points, status, error, refetch } = useFixturePriceHistory(
    match.id,
    timeRange
  );

  const sides = resolveMatchSides(match, snapshots);
  const isLive = match.status === "live";
  const orderbookEnabled = showOrderbook && Boolean(gameSnapshot);

  const tokenId = useMemo(() => {
    if (!gameSnapshot) {
      return undefined;
    }

    return findGameMarketOutcome(gameSnapshot.outcomes, matchOutcomeSide)
      ?.tokenId;
  }, [gameSnapshot, matchOutcomeSide]);

  const homeLabel = sides.home.name ?? "Home";
  const awayLabel = sides.away.name ?? "Away";

  return (
    <section
      className={cn(
        "flex flex-col gap-3 xl:flex-row xl:items-stretch",
        !orderbookEnabled && "xl:flex-col",
        className
      )}
      aria-label="Match outcome probability"
    >
      <div className={cn(probabilityCardClass, !orderbookEnabled && "w-full")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0 text-[20px] font-[556] leading-6 text-black">
              Probability
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {isLive ? (
              <LiveScoreBadge
                homeCode={sides.home.code}
                homeName={homeLabel}
                awayCode={sides.away.code}
                awayName={awayLabel}
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
          {status === "loading" ? (
            <ChartStateMessage message="Loading market price history..." />
          ) : null}

          {status === "empty" ? (
            <ChartStateMessage message="No price history available for this market." />
          ) : null}

          {status === "error" ? (
            <ChartStateMessage
              message={error ?? "Unable to load market price history."}
              actionLabel="Retry"
              onAction={() => {
                void refetch();
              }}
            />
          ) : null}

          {status === "ready" ? (
            <GameProbabilityChart
              data={points}
              homeLabel={homeLabel}
              drawLabel="Draw"
              awayLabel={awayLabel}
            />
          ) : null}
        </div>
      </div>

      {orderbookEnabled ? (
        <Orderbook tokenId={tokenId} className="w-full shrink-0 xl:w-[272px]" />
      ) : null}
    </section>
  );
}

function ChartStateMessage({
  message,
  actionLabel,
  onAction
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-[#EBEBEB] px-4 py-8 text-center">
      <p className="m-0 text-sm font-[457] leading-[17px] text-[#909090]">
        {message}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="border-0 bg-transparent p-0 text-sm font-[556] leading-[17px] text-black underline"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
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
