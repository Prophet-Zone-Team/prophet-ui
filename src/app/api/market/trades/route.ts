import { NextResponse } from "next/server";

import { fetchMarketTrades } from "@/server/market/trades";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const market = url.searchParams.get("market")?.trim();
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const filterType = url.searchParams.get("filterType") ?? "CASH";
  const filterAmount = Number(url.searchParams.get("filterAmount") ?? "1");
  const takerOnly = url.searchParams.get("takerOnly") !== "false";

  if (!market) {
    return NextResponse.json({ error: "market is required." }, { status: 400 });
  }

  if (filterType !== "CASH" && filterType !== "TOKENS") {
    return NextResponse.json(
      { error: "filterType must be CASH or TOKENS." },
      { status: 400 },
    );
  }

  try {
    const trades = await fetchMarketTrades({
      conditionId: market,
      limit: Number.isFinite(limit) ? limit : 20,
      offset: Number.isFinite(offset) ? offset : 0,
      filterType,
      filterAmount: Number.isFinite(filterAmount) ? filterAmount : 1,
      takerOnly,
    });

    return NextResponse.json({ trades });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
