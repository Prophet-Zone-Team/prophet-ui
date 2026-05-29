import { NextResponse } from "next/server";

import { deriveIntentsUserId } from "@/server/confidential/identity";
import { resolveConfidentialSession } from "@/server/confidential/auth";
import { resolveConfidentialBalances } from "@/server/confidential/balances";
import { confidentialErrorResponse } from "@/server/confidential/route-utils";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";
import type { ConfidentialAccountResponse } from "@/types/confidential";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const tradingRecord = getTradingSessionFromCookie(request.headers.get("cookie"));
    const walletAddress = tradingRecord?.session.walletAddress;

    if (!walletAddress) {
      return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
    }

    const privateAccountAddress = deriveIntentsUserId(walletAddress);
    const confidentialSession = await resolveConfidentialSession(
      request.headers.get("cookie"),
      walletAddress,
    );

    let accountStatus: ConfidentialAccountResponse["accountStatus"] = "not_created";
    let authStatus: ConfidentialAccountResponse["authStatus"] = "needs_signature";

    if (confidentialSession) {
      authStatus = "authenticated";

      try {
        const balances = await resolveConfidentialBalances(confidentialSession);
        accountStatus = BigInt(balances.usdcBalanceBaseUnits || "0") > 0n ? "funded" : "empty";
      } catch {
        accountStatus = "empty";
      }
    }

    const payload: ConfidentialAccountResponse = {
      walletAddress,
      privateAccountAddress,
      authStatus,
      accountStatus,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch (error) {
    return confidentialErrorResponse(error);
  }
}
