import { NextResponse } from "next/server";

import { fetchCopyTradeWalletForUser } from "@/server/copy-trade/copy-trade-upstream";
import { fetchUserPositions } from "@/server/trading/clob-user-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = Number(url.searchParams.get("userId"));
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const sizeThresholdParam = url.searchParams.get("sizeThreshold");
  const sizeThreshold =
    sizeThresholdParam !== null && sizeThresholdParam !== ""
      ? sizeThresholdParam
      : "0.1";
  const offset = Number(url.searchParams.get("offset") ?? "0");

  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json(
      { error: "Valid userId is required." },
      { status: 400 }
    );
  }

  try {
    const copyWallet = await fetchCopyTradeWalletForUser(
      userId,
      request.headers.get("cookie")
    );
    const depositAddress = copyWallet?.CopyDepositWalletAddress?.trim();

    if (!depositAddress) {
      return NextResponse.json(
        { error: "Copy deposit wallet is not available." },
        { status: 404 }
      );
    }

    const positions = await fetchUserPositions({
      userAddress: depositAddress,
      limit: Number.isFinite(limit) ? limit : 100,
      sizeThreshold,
      offset: Number.isFinite(offset) && offset > 0 ? offset : undefined
    });

    return NextResponse.json({
      positions,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("HTTP 401") ? 401 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
