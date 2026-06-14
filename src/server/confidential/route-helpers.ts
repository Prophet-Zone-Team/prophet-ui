import "server-only";

import { NextResponse } from "next/server";

import { resolveSessionCookiePolicy, type SessionCookiePolicy } from "@/lib/cors/session-cookie-policy";
import { isMatchingIntentsUserId } from "./intents-user-id";
import {
  clearConfidentialSessionCookie,
  createConfidentialSessionCookie,
  getConfidentialSessionFromCookie,
  getValidAccessToken,
  type ConfidentialSession,
} from "./session";

export interface ConfidentialAccess {
  session: ConfidentialSession;
  accessToken: string;
  refreshed: boolean;
  host: string | null;
  cookiePolicy: SessionCookiePolicy;
}

export type ConfidentialAccessResult =
  | { ok: true; access: ConfidentialAccess }
  | { ok: false; response: NextResponse };

/**
 * Resolve the Confidential session from the request cookie, run the tamper
 * check, and return a valid (possibly refreshed) access token. Returns a 401
 * response when the caller is not authenticated.
 */
export async function requireConfidentialAccess(
  request: Request,
): Promise<ConfidentialAccessResult> {
  const host = request.headers.get("host");
  const cookiePolicy = resolveSessionCookiePolicy(request);
  const session = getConfidentialSessionFromCookie(request.headers.get("cookie"));

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Confidential session not found." }, { status: 401 }),
    };
  }

  if (!isMatchingIntentsUserId(session.eoaAddress, session.intentsUserId)) {
    const response = NextResponse.json(
      { error: "Confidential session failed verification." },
      { status: 401 },
    );
    response.headers.set("Set-Cookie", clearConfidentialSessionCookie(host, cookiePolicy));
    return { ok: false, response };
  }

  try {
    const { accessToken, session: validSession, refreshed } = await getValidAccessToken(session);
    return {
      ok: true,
      access: { session: validSession, accessToken, refreshed, host, cookiePolicy },
    };
  } catch {
    const response = NextResponse.json(
      { error: "Confidential session expired. Re-authenticate from the main site." },
      { status: 401 },
    );
    response.headers.set("Set-Cookie", clearConfidentialSessionCookie(host, cookiePolicy));
    return { ok: false, response };
  }
}

/** Persist a refreshed session back to the cookie on the outgoing response. */
export function applyRefreshedCookie(response: NextResponse, access: ConfidentialAccess): NextResponse {
  if (access.refreshed) {
    response.headers.set(
      "Set-Cookie",
      createConfidentialSessionCookie(access.session, access.host, access.cookiePolicy),
    );
  }

  return response;
}
