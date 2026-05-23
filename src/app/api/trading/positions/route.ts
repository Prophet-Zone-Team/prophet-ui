import { NextResponse } from "next/server";

import { fetchUserPositions } from "../../../../server/trading/clob-user-client";
import { getTradingSessionFromCookie } from "../../../../server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  const url = new URL(request.url);
  const conditionIds = url.searchParams.get("market")?.split(",").filter(Boolean);
  const limit = Number(url.searchParams.get("limit") ?? "100");

  try {
    const positions = await fetchUserPositions({
      userAddress: record.session.funderAddress ?? record.session.walletAddress,
      conditionIds,
      limit: Number.isFinite(limit) ? limit : 100,
    });

    return NextResponse.json({
      positions,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
