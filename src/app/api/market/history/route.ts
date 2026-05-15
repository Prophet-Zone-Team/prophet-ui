import { NextResponse, type NextRequest } from "next/server";

import { isEnabledMarketDataSource, parseMarketDataSource } from "../../../../data/providers/source";
import { readProbabilityHistory } from "../../../../server/market-history/historyReader";
import type { StoredMarketDataSource } from "../../../../server/market-history/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sourceParam = request.nextUrl.searchParams.get("source") ?? undefined;
  if (sourceParam && !isEnabledMarketDataSource(sourceParam)) {
    return NextResponse.json({ error: "Only Polymarket market history is currently enabled." }, { status: 400 });
  }

  const source = parseMarketDataSource(sourceParam);
  const teamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
  const days = parseDays(request.nextUrl.searchParams.get("days"));

  const history = await readProbabilityHistory({
    source: source as StoredMarketDataSource,
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
