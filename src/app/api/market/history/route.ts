import { NextResponse, type NextRequest } from "next/server";

import { parseMarketDataSource } from "../../../../data/providers/source";
import { readProbabilityHistory } from "../../../../server/market-history/historyReader";
import type { StoredMarketDataSource } from "../../../../server/market-history/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const source = parseMarketDataSource(request.nextUrl.searchParams.get("source") ?? undefined);
  const teamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
  const days = parseDays(request.nextUrl.searchParams.get("days"));

  if (source === "mock") {
    return NextResponse.json({ error: "Mock source does not use stored market history." }, { status: 400 });
  }

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
