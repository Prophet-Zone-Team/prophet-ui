import { NextResponse } from "next/server";

import { fetchUserPositions } from "@/server/trading/clob-user-client";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

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
  const redeemableParam = url.searchParams.get("redeemable");
  const redeemable =
    redeemableParam === "true"
      ? true
      : redeemableParam === "false"
        ? false
        : undefined;
  const sizeThresholdParam = url.searchParams.get("sizeThreshold");
  const sizeThreshold =
    sizeThresholdParam !== null && sizeThresholdParam !== ""
      ? sizeThresholdParam
      : undefined;
  const offset = Number(url.searchParams.get("offset") ?? "0");

  try {
    const positions = await fetchUserPositions({
      userAddress: record.session.funderAddress ?? record.session.walletAddress,
      conditionIds,
      limit: Number.isFinite(limit) ? limit : 100,
      redeemable,
      sizeThreshold,
      offset: Number.isFinite(offset) && offset > 0 ? offset : undefined
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
