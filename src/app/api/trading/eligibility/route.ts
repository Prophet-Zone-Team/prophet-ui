import { NextResponse } from "next/server";

import { checkTradingEligibility, refreshSessionEligibility } from "../../../../server/trading/eligibility";
import { createTradingSessionCookie, getTradingSessionFromCookie } from "../../../../server/trading/sessionStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (record) {
    const session = await refreshSessionEligibility(record.session);

    return NextResponse.json(
      {
        eligibility: {
          status: session.eligibilityStatus,
          checkedAt: session.eligibilityCheckedAt,
          country: session.eligibilityCountry,
          region: session.eligibilityRegion,
          reason: session.eligibilityReason,
        },
      },
      {
        headers: {
          "Set-Cookie": createTradingSessionCookie(session),
        },
      },
    );
  }

  const eligibility = await checkTradingEligibility();

  return NextResponse.json({
    eligibility,
  });
}
