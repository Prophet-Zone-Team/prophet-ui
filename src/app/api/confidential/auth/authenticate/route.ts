import { NextResponse } from "next/server";

import { resolveSessionCookiePolicy } from "@/lib/cors/session-cookie-policy";
import { buildAuthSignedData, verifyAccessTokenIdentity } from "@/server/confidential/auth";
import { deriveIntentsUserId, normalizeEvmAddress } from "@/server/confidential/intents-user-id";
import { authenticateOneClick } from "@/server/confidential/one-click-client";
import {
  createConfidentialSessionCookie,
  type ConfidentialSession,
} from "@/server/confidential/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AuthenticatePayload {
  eoaAddress?: string;
  message?: string;
  signature?: string;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as AuthenticatePayload;
  const eoaAddress = payload.eoaAddress?.trim();
  const message = payload.message;
  const signature = payload.signature?.trim();

  if (!eoaAddress || !/^0x[a-fA-F0-9]{40}$/.test(eoaAddress)) {
    return NextResponse.json({ error: "A valid EOA wallet address is required." }, { status: 400 });
  }

  if (!message || !signature || !/^0x[a-fA-F0-9]+$/.test(signature)) {
    return NextResponse.json({ error: "A signed verification message is required." }, { status: 400 });
  }

  try {
    const normalizedEoa = normalizeEvmAddress(eoaAddress);
    const intentsUserId = deriveIntentsUserId(normalizedEoa);
    const signedData = buildAuthSignedData(normalizedEoa, message, signature);
    const tokens = await authenticateOneClick(signedData);

    const identity = await verifyAccessTokenIdentity(tokens.accessToken, intentsUserId);

    if (!identity) {
      return NextResponse.json(
        { error: "Authenticated account does not match the connected wallet." },
        { status: 401 },
      );
    }

    const now = Date.now();
    const session: ConfidentialSession = {
      eoaAddress: normalizedEoa,
      authMethod: "evm",
      intentsUserId,
      accessToken: tokens.accessToken,
      accessExpiresAt: new Date(now + tokens.expiresIn * 1000).toISOString(),
      refreshToken: tokens.refreshToken,
      refreshExpiresAt: tokens.refreshExpiresIn
        ? new Date(now + tokens.refreshExpiresIn * 1000).toISOString()
        : undefined,
      createdAt: new Date(now).toISOString(),
    };

    const response = NextResponse.json({ intentsUserId });
    const cookiePolicy = resolveSessionCookiePolicy(request);
    response.headers.set(
      "Set-Cookie",
      createConfidentialSessionCookie(session, request.headers.get("host"), cookiePolicy),
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
