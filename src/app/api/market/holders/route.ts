import { NextResponse } from "next/server";

import { fetchMarketTopHolders } from "@/server/market/top-holders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const market = url.searchParams.get("market")?.trim();
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const minBalance = Number(url.searchParams.get("minBalance") ?? "1");

  if (!market) {
    return NextResponse.json({ error: "market is required." }, { status: 400 });
  }

  const conditionIds = market.split(",").map((value) => value.trim()).filter(Boolean);

  try {
    const holders = await fetchMarketTopHolders({
      conditionIds,
      limit: Number.isFinite(limit) ? limit : 20,
      minBalance: Number.isFinite(minBalance) ? minBalance : 1,
    });

    return NextResponse.json({ holders });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
