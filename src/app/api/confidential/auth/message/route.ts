import { NextResponse } from "next/server";

import { createVerificationMessage } from "@/server/confidential/auth";
import { deriveIntentsUserId } from "@/server/confidential/identity";
import { confidentialErrorResponse } from "@/server/confidential/route-utils";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const tradingRecord = getTradingSessionFromCookie(request.headers.get("cookie"));

    if (!tradingRecord?.session.walletAddress) {
      return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
    }

    const walletAddress = tradingRecord.session.walletAddress;
    const message = await createVerificationMessage(walletAddress);

    return NextResponse.json({
      walletAddress,
      privateAccountAddress: deriveIntentsUserId(walletAddress),
      message,
      chainType: "evm",
    });
  } catch (error) {
    return confidentialErrorResponse(error);
  }
}
