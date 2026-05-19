import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_MARKET_DATA_SOURCE } from "../../../../../data/providers/source";
import { collectMarketSnapshots } from "../../../../../server/market-history/collector";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized market snapshot collection request." }, { status: 401 });
  }

  const result = await collectMarketSnapshots(DEFAULT_MARKET_DATA_SOURCE);

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
