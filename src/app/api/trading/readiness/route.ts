import { NextResponse } from "next/server";

import { parseOrderFundingRequirement } from "@/server/trading/balances";
import { buildUserTradingReadiness } from "@/server/trading/readiness";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenId = url.searchParams.get("tokenId") ?? undefined;
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));
  const readiness = await buildUserTradingReadiness({
    record,
    tokenId,
    fundingRequirement: parseOrderFundingRequirement({
      tradeSide: url.searchParams.get("tradeSide"),
      cost: parseNumberParam(url.searchParams.get("cost")),
      size: parseNumberParam(url.searchParams.get("size")),
      totalCost: parseNumberParam(url.searchParams.get("totalCost")),
      estimatedTakerFee: parseNumberParam(url.searchParams.get("estimatedTakerFee")),
    }),
  });

  return NextResponse.json(readiness);
}

function parseNumberParam(value: string | null) {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}
