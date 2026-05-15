import { NextResponse, type NextRequest } from "next/server";

import { isEnabledMarketDataSource, parseMarketDataSource } from "../../../../data/providers/source";
import { getMarketHistoryRepository } from "../../../../server/market-history/repository";
import type { StoredMarketDataSource } from "../../../../server/market-history/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sourceParam = request.nextUrl.searchParams.get("source") ?? undefined;

  if (sourceParam && !isEnabledMarketDataSource(sourceParam)) {
    return NextResponse.json({ error: "Only Polymarket market universe data is currently enabled." }, { status: 400 });
  }

  const source = parseMarketDataSource(sourceParam) as StoredMarketDataSource;
  const repository = await getMarketHistoryRepository();
  const universe = await repository.readLatestUniverseSnapshot(source);

  if (!universe) {
    return NextResponse.json(
      {
        source,
        status: "empty",
        universe: null,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    source,
    status: "ok",
    universe,
  });
}
