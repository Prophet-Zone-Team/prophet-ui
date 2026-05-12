import { NextResponse, type NextRequest } from "next/server";

import { parseMarketDataSource } from "../../../../../data/providers/source";
import { collectAllMarketSnapshots, collectMarketSnapshots } from "../../../../../server/market-history/collector";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized market snapshot collection request." }, { status: 401 });
  }

  const sourceParam = request.nextUrl.searchParams.get("source") ?? undefined;

  if (!sourceParam || sourceParam === "all") {
    const results = await collectAllMarketSnapshots();
    return NextResponse.json({ mode: "all", results });
  }

  const source = parseMarketDataSource(sourceParam);

  if (source === "mock") {
    return NextResponse.json({ error: "Mock data cannot be collected into market history." }, { status: 400 });
  }

  const result = await collectMarketSnapshots(source);

  return NextResponse.json(result);
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.MARKET_COLLECTOR_SECRET;

  if (!secret && process.env.NODE_ENV !== "production") {
    return true;
  }

  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerToken = request.headers.get("x-market-collector-secret");

  return Boolean(secret && (bearerToken === secret || headerToken === secret));
}
