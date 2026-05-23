import { NextResponse } from "next/server";

import { fetchOnchainCollateralSnapshot } from "../../../../server/trading/onchain-balances";
import { getTradingSessionFromCookie } from "../../../../server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));
  const onchainCollateral = record?.session.funderAddress
    ? await fetchOnchainCollateralSnapshot(record.session.funderAddress)
    : undefined;

  return NextResponse.json({
    hasSession: Boolean(record?.session),
    walletAddress: record?.session.walletAddress,
    funderAddress: record?.session.funderAddress,
    depositWalletStatus: record?.session.depositWalletStatus,
    eligibilityStatus: record?.session.eligibilityStatus,
    hasCredentials: Boolean(record?.credentials),
    credentialDerivedAt: record?.credentials?.derivedAt,
    onchainCollateral,
    cookieNames: (request.headers.get("cookie") ?? "")
      .split(";")
      .map((item) => item.trim().split("=")[0])
      .filter(Boolean),
  });
}
