import { NextResponse } from "next/server";

import { fetchUserActivityFromUpstream } from "@/server/portfolio/activity-upstream";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  const userAddress =
    record.session.funderAddress ?? record.session.walletAddress;

  if (!userAddress) {
    return NextResponse.json(
      { error: "Trading session is missing a Polymarket address." },
      { status: 409 },
    );
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "25");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const normalizedLimit = Math.max(
    1,
    Math.min(Number.isFinite(limit) ? limit : 25, 500),
  );
  const normalizedOffset = Math.max(
    0,
    Number.isFinite(offset) ? offset : 0,
  );

  try {
    const activities = await fetchUserActivityFromUpstream(userAddress, {
      limit: normalizedLimit,
      offset: normalizedOffset,
    });

    return NextResponse.json({
      activities,
      hasMore: activities.length === normalizedLimit,
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
