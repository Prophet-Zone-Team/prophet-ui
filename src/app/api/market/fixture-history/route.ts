import { NextResponse } from "next/server";

import { getFootballMatches } from "@/data/providers/football-matches";
import { findWorldCupMatch } from "@/lib/market/game-market-snapshot";
import {
  buildFixtureChartPoints,
  mapUiRangeToClobInterval,
} from "@/lib/market/fixture-probability-chart";
import {
  fetchBatchTokenPriceHistory,
  type FixtureHistoryInterval,
} from "@/server/market/clob-prices-history";
import type { GameFixtureChartTimeRange, MatchOutcomeSide } from "@/types/market";

export const dynamic = "force-dynamic";

const FIXTURE_HISTORY_CACHE_TTL_MS = 60_000;

interface CachedFixtureHistoryResponse {
  payload: FixtureHistoryResponse;
  expiresAt: number;
}

interface FixtureHistoryResponse {
  matchSlug: string;
  interval: FixtureHistoryInterval;
  points: ReturnType<typeof buildFixtureChartPoints>;
  updatedAt: string;
  volume?: number;
}

const fixtureHistoryCache = new Map<string, CachedFixtureHistoryResponse>();

const VALID_UI_RANGES: GameFixtureChartTimeRange[] = ["1D", "1W", "1M", "all"];
const VALID_INTERVALS: FixtureHistoryInterval[] = ["1h", "1d", "1w", "1m", "max", "all"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const matchSlug = url.searchParams.get("matchSlug")?.trim();
  const intervalParam = url.searchParams.get("interval")?.trim();
  const rangeParam = url.searchParams.get("range")?.trim() as
    | GameFixtureChartTimeRange
    | undefined;

  if (!matchSlug) {
    return NextResponse.json({ error: "matchSlug is required." }, { status: 400 });
  }

  const interval = resolveInterval(intervalParam, rangeParam);

  if (!interval) {
    return NextResponse.json(
      { error: "interval or range must be one of 1D, 1W, 1M, all." },
      { status: 400 },
    );
  }

  const cacheKey = `${matchSlug}:${interval}`;
  const cached = fixtureHistoryCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload);
  }

  try {
    const { matches } = await getFootballMatches();
    const match = findWorldCupMatch(matchSlug, matches);

    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const outcomes = match.polymarket?.moneyline.outcomes ?? [];
    const tokenOutcomes = outcomes.filter(
      (outcome): outcome is typeof outcome & { tokenId: string } =>
        Boolean(outcome.tokenId),
    );

    if (tokenOutcomes.length === 0) {
      return NextResponse.json(
        { error: "Match moneyline token IDs are unavailable." },
        { status: 404 },
      );
    }

    const historyByToken = await fetchBatchTokenPriceHistory({
      markets: tokenOutcomes.map((outcome) => outcome.tokenId),
      interval,
    });

    const points = buildFixtureChartPoints(
      match.id,
      tokenOutcomes.map((outcome) => ({
        side: outcome.side as MatchOutcomeSide,
        tokenId: outcome.tokenId,
        history: historyByToken.get(outcome.tokenId) ?? [],
      })),
    );

    const payload: FixtureHistoryResponse = {
      matchSlug,
      interval,
      points,
      updatedAt: new Date().toISOString(),
      volume: match.polymarket?.volume,
    };

    fixtureHistoryCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + FIXTURE_HISTORY_CACHE_TTL_MS,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}

function resolveInterval(
  intervalParam: string | undefined,
  rangeParam: GameFixtureChartTimeRange | undefined,
): FixtureHistoryInterval | undefined {
  if (rangeParam && VALID_UI_RANGES.includes(rangeParam)) {
    return mapUiRangeToClobInterval(rangeParam);
  }

  if (intervalParam && VALID_INTERVALS.includes(intervalParam as FixtureHistoryInterval)) {
    return intervalParam as FixtureHistoryInterval;
  }

  return undefined;
}
