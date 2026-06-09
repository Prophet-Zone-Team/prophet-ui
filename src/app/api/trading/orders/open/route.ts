import { NextResponse } from "next/server";

import { fetchUserOpenOrders } from "@/server/trading/clob-user-client";
import { refreshPersistedOrderStatuses } from "@/server/trading/order-store";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.credentials) {
    return NextResponse.json({ error: "User CLOB credentials are required to fetch open orders." }, { status: 409 });
  }

  const url = new URL(request.url);

  try {
    const orders = await fetchUserOpenOrders({
      address: record.session.walletAddress,
      credentials: record.credentials,
      market: url.searchParams.get("market") ?? undefined,
      tokenId: url.searchParams.get("tokenId") ?? undefined,
    });
    const updatedAt = new Date().toISOString();
    const history = await refreshPersistedOrderStatuses({
      session: record.session,
      openOrders: orders,
      refreshedAt: updatedAt,
    });

    return NextResponse.json({
      orders,
      history,
      updatedAt,
    });
  } catch (error) {
    console.warn("[trading.orders.open] fetch failed", {
      userId: record.session.userId,
      walletAddress: record.session.walletAddress,
      market: url.searchParams.get("market") ?? undefined,
      tokenId: url.searchParams.get("tokenId") ?? undefined,
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
