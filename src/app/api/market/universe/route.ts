import { NextResponse } from "next/server";

import { DEFAULT_MARKET_DATA_SOURCE } from "@/data/providers/source";
import { getMarketHistoryRepository } from "@/server/market-history/repository";
import type { StoredMarketDataSource } from "@/server/market-history/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const source = DEFAULT_MARKET_DATA_SOURCE as StoredMarketDataSource;
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
