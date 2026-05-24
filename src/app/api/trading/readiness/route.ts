import { NextResponse } from "next/server";

import { parseOrderFundingRequirement } from "@/server/trading/balances";
import { getClientIp, refreshSessionEligibilityIfStale } from "@/server/trading/eligibility";
import { buildUserTradingReadiness } from "@/server/trading/readiness";
import { createTradingSessionCookie, getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenId = url.searchParams.get("tokenId") ?? undefined;
  let record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (record) {
    const refreshedSession = await refreshSessionEligibilityIfStale(
      record.session,
      getClientIp(request),
    );
    record = {
      ...record,
      session: refreshedSession,
    };
  }

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

  return NextResponse.json(readiness, {
    headers: record
      ? {
          "Set-Cookie": createTradingSessionCookie(record.session),
        }
      : undefined,
  });
}

function parseNumberParam(value: string | null) {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}
