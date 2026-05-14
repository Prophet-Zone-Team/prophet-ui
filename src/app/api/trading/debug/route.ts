import { NextResponse } from "next/server";

import { getTradingSessionFromCookie } from "../../../../server/trading/sessionStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  return NextResponse.json({
    hasSession: Boolean(record?.session),
    walletAddress: record?.session.walletAddress,
    funderAddress: record?.session.funderAddress,
    depositWalletStatus: record?.session.depositWalletStatus,
    eligibilityStatus: record?.session.eligibilityStatus,
    hasCredentials: Boolean(record?.credentials),
    credentialDerivedAt: record?.credentials?.derivedAt,
    cookieNames: (request.headers.get("cookie") ?? "")
      .split(";")
      .map((item) => item.trim().split("=")[0])
      .filter(Boolean),
  });
}
