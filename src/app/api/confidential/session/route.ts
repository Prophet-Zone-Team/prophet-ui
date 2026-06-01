import { NextResponse } from "next/server";

import { verifyAccessTokenIdentity } from "@/server/confidential/auth";
import { isMatchingIntentsUserId } from "@/server/confidential/intents-user-id";
import {
  clearConfidentialSessionCookie,
  createConfidentialSessionCookie,
  getConfidentialSessionFromCookie,
  getValidAccessToken,
} from "@/server/confidential/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const host = request.headers.get("host");
  const session = getConfidentialSessionFromCookie(request.headers.get("cookie"));

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  // Tamper check: the cookie's intentsUserId must re-derive from its EOA.
  if (!isMatchingIntentsUserId(session.eoaAddress, session.intentsUserId)) {
    const response = NextResponse.json({ authenticated: false });
    response.headers.set("Set-Cookie", clearConfidentialSessionCookie(host));
    return response;
  }

  try {
    const { accessToken, session: validSession, refreshed } = await getValidAccessToken(session);
    const identity = await verifyAccessTokenIdentity(accessToken, validSession.intentsUserId);

    if (!identity) {
      const response = NextResponse.json({ authenticated: false });
      response.headers.set("Set-Cookie", clearConfidentialSessionCookie(host));
      return response;
    }

    const response = NextResponse.json({
      authenticated: true,
      eoaAddress: validSession.eoaAddress,
      intentsUserId: validSession.intentsUserId,
    });

    if (refreshed) {
      response.headers.set("Set-Cookie", createConfidentialSessionCookie(validSession, host));
    }

    return response;
  } catch {
    const response = NextResponse.json({ authenticated: false });
    response.headers.set("Set-Cookie", clearConfidentialSessionCookie(host));
    return response;
  }
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", clearConfidentialSessionCookie(request.headers.get("host")));
  return response;
}
