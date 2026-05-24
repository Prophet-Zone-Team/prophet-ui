import { NextResponse } from "next/server";

import { submitStableflowDepositTx } from "@/server/trading/stableflow";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubmitDepositTxPayload {
  txHash?: string;
  depositAddress?: string;
}

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  const payload = (await request.json()) as SubmitDepositTxPayload;

  if (!payload.txHash?.trim() || !/^0x[a-fA-F0-9]+$/.test(payload.txHash.trim())) {
    return NextResponse.json({ error: "txHash must be a valid transaction hash." }, { status: 400 });
  }

  if (!payload.depositAddress?.trim()) {
    return NextResponse.json({ error: "depositAddress is required." }, { status: 400 });
  }

  try {
    const response = await submitStableflowDepositTx({
      txHash: payload.txHash.trim(),
      depositAddress: payload.depositAddress.trim(),
    });

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
