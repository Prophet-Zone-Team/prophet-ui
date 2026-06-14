import { NextResponse } from "next/server";

import { resolveSessionCookiePolicy } from "@/lib/cors/session-cookie-policy";
import {
  checkTradingEligibility,
  getClientGeoFromRequest,
  refreshSessionEligibilityIfStale,
} from "@/server/trading/eligibility";
import { createTradingSessionCookie, getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));
  if (record) {
    const session = await refreshSessionEligibilityIfStale(
      record.session,
      getClientGeoFromRequest(request),
    );

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
          "Set-Cookie": createTradingSessionCookie(session, resolveSessionCookiePolicy(request)),
        },
      },
    );
  }

  const eligibility = await checkTradingEligibility(getClientGeoFromRequest(request));

  return NextResponse.json({
    eligibility,
  });
}
