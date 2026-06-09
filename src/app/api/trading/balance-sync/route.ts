import { NextResponse } from "next/server";

import { updateUserBalanceAllowance } from "@/server/trading/clob-user-client";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BalanceSyncPayload {
  tokenId?: string;
}

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.credentials) {
    return NextResponse.json({ error: "User CLOB credentials are required before balance sync." }, { status: 409 });
  }

  const payload = (await request.json().catch(() => ({}))) as BalanceSyncPayload;

  if (payload.tokenId !== undefined && !/^\d+$/.test(payload.tokenId)) {
    return NextResponse.json({ error: "tokenId must be numeric." }, { status: 400 });
  }

  try {
    await updateUserBalanceAllowance({
      address: record.session.walletAddress,
      credentials: record.credentials,
      signatureType: record.session.signatureType,
      tokenId: payload.tokenId,
    });

    return NextResponse.json({
      syncedAt: new Date().toISOString(),
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
