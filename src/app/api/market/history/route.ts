import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_MARKET_DATA_SOURCE } from "../../../../data/providers/source";
import { readProbabilityHistory } from "../../../../server/market-history/historyReader";
import type { StoredMarketDataSource } from "../../../../server/market-history/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const source = DEFAULT_MARKET_DATA_SOURCE as StoredMarketDataSource;
  const teamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
  const days = parseDays(request.nextUrl.searchParams.get("days"));

  const history = await readProbabilityHistory({
    source,
    teamId,
    days,
  });

  return NextResponse.json({
    source,
    teamId,
    days,
    history,
  });
}

function parseDays(value: string | null): number {
  if (!value) {
    return 30;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}
