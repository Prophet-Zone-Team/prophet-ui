import { NextResponse } from "next/server";

import { fetchUserActivity } from "@/server/trading/clob-user-client";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "25");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const userAddress = record.session.funderAddress ?? record.session.walletAddress;

  try {
    const activities = await fetchUserActivity({
      userAddress,
      limit: Number.isFinite(limit) ? limit : 25,
      offset: Number.isFinite(offset) ? offset : 0,
    });

    return NextResponse.json({
      activities,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("[trading.orders.history] activity fetch failed", {
      userId: record.session.userId,
      userAddress,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
