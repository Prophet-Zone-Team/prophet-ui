import { NextResponse } from "next/server";

import { readUserOrderHistory } from "../../../../../server/trading/order-store";
import { getTradingSessionFromCookie } from "../../../../../server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "25");
  const orders = await readUserOrderHistory(record.session.userId, Number.isFinite(limit) ? limit : 25);

  return NextResponse.json({
    orders,
    updatedAt: new Date().toISOString(),
  });
}
