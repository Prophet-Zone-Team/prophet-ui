import { NextResponse } from "next/server";

import { getStableflowExecutionStatus } from "@/server/trading/stableflow";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  const url = new URL(request.url);
  const depositAddress = url.searchParams.get("depositAddress")?.trim();
  const depositMemo = url.searchParams.get("depositMemo")?.trim() || undefined;

  if (!depositAddress) {
    return NextResponse.json({ error: "depositAddress is required." }, { status: 400 });
  }

  try {
    const status = await getStableflowExecutionStatus(depositAddress, depositMemo);

    return NextResponse.json({ status });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
