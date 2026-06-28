import { NextResponse } from "next/server";

import {
  assertWhitelistEmailAccess,
  isEligibilityWhitelistConfigured,
} from "@/server/trading/eligibility-whitelist";
import { getClientGeoFromRequest } from "@/server/trading/eligibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WhitelistCheckPayload {
  email?: string;
}

export async function POST(request: Request) {
  if (!isEligibilityWhitelistConfigured()) {
    return NextResponse.json({
      allowed: false,
      reason: "Email whitelist login is not available.",
    });
  }

  let payload: WhitelistCheckPayload;

  try {
    payload = (await request.json()) as WhitelistCheckPayload;
  } catch {
    return NextResponse.json(
      { allowed: false, reason: "Invalid request body." },
      { status: 400 },
    );
  }

  const email = payload.email?.trim();

  if (!email) {
    return NextResponse.json(
      { allowed: false, reason: "Email is required." },
      { status: 400 },
    );
  }

  const clientGeo = getClientGeoFromRequest(request);
  const access = assertWhitelistEmailAccess(email, clientGeo);

  return NextResponse.json({
    allowed: access.ok,
    reason: access.ok ? undefined : access.reason,
  });
}
