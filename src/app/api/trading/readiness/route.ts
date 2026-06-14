import { NextResponse } from "next/server";

import { resolveSessionCookiePolicy } from "@/lib/cors/session-cookie-policy";
import { buildUserTradingReadiness } from "@/server/trading/readiness";
import { createTradingSessionCookie, getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  let record = getTradingSessionFromCookie(request.headers.get("cookie"));
  const readiness = await buildUserTradingReadiness({ record });

  return NextResponse.json(readiness, {
    headers: record?.session
      ? {
          "Set-Cookie": createTradingSessionCookie(
            readiness.session ?? record.session,
            resolveSessionCookiePolicy(request),
          ),
        }
      : undefined,
  });
}
