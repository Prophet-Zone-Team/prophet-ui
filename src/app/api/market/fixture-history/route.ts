import { NextResponse } from "next/server";

import { getFootballMatchBySlug } from "@/data/providers/football-matches";
import {
  attachHistoryToBinaryInputs,
  attachHistoryToTernaryInputs,
  resolveFixtureChartTokens
} from "@/lib/market/fixture-chart-tokens";
import {
  buildBinaryFixtureChartPoints,
  buildFixtureChartPoints,
  mapUiRangeToClobInterval
} from "@/lib/market/fixture-probability-chart";
import {
  fetchBatchTokenPriceHistory,
  type FixtureHistoryInterval,
} from "@/server/market/clob-prices-history";
import type {
  FixtureChartKind,
  GameFixtureChartTimeRange
} from "@/types/market";

export const dynamic = "force-dynamic";

const FIXTURE_HISTORY_CACHE_TTL_MS = 60_000;

interface CachedFixtureHistoryResponse {
  payload: FixtureHistoryResponse;
  expiresAt: number;
}

interface FixtureHistoryResponse {
  matchSlug: string;
  interval: FixtureHistoryInterval;
  chartKind: FixtureChartKind;
  lineKey?: string;
  chartMode: "ternary" | "binary";
  points: ReturnType<typeof buildFixtureChartPoints>;
  binaryPoints: ReturnType<typeof buildBinaryFixtureChartPoints>;
  updatedAt: string;
  volume?: number;
}

const fixtureHistoryCache = new Map<string, CachedFixtureHistoryResponse>();

const VALID_UI_RANGES: GameFixtureChartTimeRange[] = ["1D", "1W", "1M", "all"];
const VALID_INTERVALS: FixtureHistoryInterval[] = ["1h", "1d", "1w", "1m", "max", "all"];
const VALID_CHART_KINDS: FixtureChartKind[] = [
  "moneyline",
  "halftime",
  "total",
  "spread"
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const matchSlug = url.searchParams.get("matchSlug")?.trim();
  const intervalParam = url.searchParams.get("interval")?.trim();
  const rangeParam = url.searchParams.get("range")?.trim() as
    | GameFixtureChartTimeRange
    | undefined;
  const chartKindParam = url.searchParams.get("chartKind")?.trim() as
    | FixtureChartKind
    | undefined;
  const lineKey = url.searchParams.get("lineKey")?.trim() || undefined;

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

  const chartKind =
    chartKindParam && VALID_CHART_KINDS.includes(chartKindParam)
      ? chartKindParam
      : "moneyline";

  const cacheKey = `${matchSlug}:${interval}:${chartKind}:${lineKey ?? ""}`;
  const cached = fixtureHistoryCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload);
  }

  try {
    const match = await getFootballMatchBySlug(matchSlug);

    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const tokenResolution = resolveFixtureChartTokens(
      match,
      chartKind,
      lineKey
    );

    if (!tokenResolution) {
      return NextResponse.json(
        { error: `Chart tokens unavailable for ${chartKind}.` },
        { status: 404 }
      );
    }

    const tokenIds = tokenResolution.inputs.map((input) => input.tokenId);
    const historyByToken = await fetchBatchTokenPriceHistory({
      markets: tokenIds,
      interval
    });

    const payload: FixtureHistoryResponse = {
      matchSlug,
      interval,
      chartKind,
      lineKey,
      chartMode: tokenResolution.mode,
      points: [],
      binaryPoints: [],
      updatedAt: new Date().toISOString(),
      volume: match.polymarket?.volume
    };

    if (tokenResolution.mode === "ternary") {
      payload.points = buildFixtureChartPoints(
        match.id,
        attachHistoryToTernaryInputs(tokenResolution.inputs, historyByToken)
      );
    } else {
      payload.binaryPoints = buildBinaryFixtureChartPoints(
        match.id,
        attachHistoryToBinaryInputs(tokenResolution.inputs, historyByToken)
      );
    }

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
