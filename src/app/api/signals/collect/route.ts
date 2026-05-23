import { NextResponse, type NextRequest } from "next/server";

import {
  collectAllSignalData,
  collectApiFootballSignals,
  collectGdeltNewsSignals,
} from "@/server/signal-data/collector";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized signal data collection request." }, { status: 401 });
  }

  const source = request.nextUrl.searchParams.get("source") ?? "all";

  if (source === "gdelt") {
    return NextResponse.json(await collectGdeltNewsSignals());
  }

  if (source === "api-football") {
    return NextResponse.json(await collectApiFootballSignals());
  }

  if (source === "all") {
    return NextResponse.json({ mode: "all", results: await collectAllSignalData() });
  }

  return NextResponse.json({ error: `Unsupported signal source: ${source}` }, { status: 400 });
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
