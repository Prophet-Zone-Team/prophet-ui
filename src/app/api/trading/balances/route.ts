import { NextResponse } from "next/server";

import { parseOrderFundingRequirement } from "@/server/trading/balances";
import { buildUserTradingBalances } from "@/server/trading/user-trading-balances";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  const response = await buildUserTradingBalances({
    record,
    tokenId: url.searchParams.get("tokenId") ?? undefined,
    fundingRequirement: parseOrderFundingRequirement({
      tradeSide: url.searchParams.get("tradeSide"),
      cost: parseNumberParam(url.searchParams.get("cost")),
      size: parseNumberParam(url.searchParams.get("size")),
      totalCost: parseNumberParam(url.searchParams.get("totalCost")),
      estimatedTakerFee: parseNumberParam(url.searchParams.get("estimatedTakerFee")),
    }),
  });

  return NextResponse.json(response);
}

function parseNumberParam(value: string | null) {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}
