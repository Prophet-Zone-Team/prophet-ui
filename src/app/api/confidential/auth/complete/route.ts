import { NextResponse } from "next/server";

import { completeConfidentialAuthentication } from "@/server/confidential/auth";
import { deriveIntentsUserId } from "@/server/confidential/identity";
import {
  createConfidentialSessionCookie,
  type ConfidentialSessionRecord,
} from "@/server/confidential/session-store";
import { confidentialErrorResponse } from "@/server/confidential/route-utils";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";
import { updateTradingSession } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CompleteAuthPayload {
  walletAddress?: string;
  signedData?: unknown;
}

export async function POST(request: Request) {
  try {
    const tradingRecord = getTradingSessionFromCookie(request.headers.get("cookie"));

    if (!tradingRecord?.session.walletAddress) {
      return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
    }

    const payload = (await request.json()) as CompleteAuthPayload;
    const walletAddress = payload.walletAddress?.trim() || tradingRecord.session.walletAddress;

    if (walletAddress.toLowerCase() !== tradingRecord.session.walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "walletAddress must match the active trading session wallet." },
        { status: 400 },
      );
    }

    if (!payload.signedData) {
      return NextResponse.json({ error: "signedData is required." }, { status: 400 });
    }

    const record = await completeConfidentialAuthentication({
      walletAddress,
      signedData: payload.signedData,
    });

    const privateAccountAddress = deriveIntentsUserId(walletAddress);
    const nextTradingSession = {
      ...tradingRecord.session,
      privateAccountAddress,
    };

    updateTradingSession(nextTradingSession);

    const response = NextResponse.json({
      walletAddress,
      privateAccountAddress,
      authStatus: "authenticated",
      accountStatus: "empty",
      session: sanitizeConfidentialSession(record),
    });

    response.headers.append("Set-Cookie", createConfidentialSessionCookie(record));

    return response;
  } catch (error) {
    return confidentialErrorResponse(error, 401);
  }
}

function sanitizeConfidentialSession(record: ConfidentialSessionRecord) {
  return {
    walletAddress: record.walletAddress,
    intentsUserId: record.intentsUserId,
    accessExpiresAt: record.accessExpiresAt,
    refreshExpiresAt: record.refreshExpiresAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
