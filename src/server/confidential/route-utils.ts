import "server-only";

import { NextResponse } from "next/server";

import { resolveConfidentialSession } from "@/server/confidential/auth";
import { getOneClickConfig } from "@/server/confidential/config";
import type { ConfidentialSessionRecord } from "@/server/confidential/session-store";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export function confidentialErrorResponse(error: unknown, fallbackStatus = 502) {
  const message = error instanceof Error ? error.message : String(error);
  const status = /not configured|must be a valid|does not match|not found|required/i.test(message)
    ? message.includes("not configured")
      ? 500
      : 400
    : fallbackStatus;

  return NextResponse.json({ error: message }, { status });
}

export async function requireConfidentialSession(
  request: Request,
  expectedWalletAddress?: string,
): Promise<ConfidentialSessionRecord | NextResponse> {
  try {
    getOneClickConfig();
  } catch (error) {
    return confidentialErrorResponse(error, 500);
  }

  const session = await resolveConfidentialSession(request.headers.get("cookie"), expectedWalletAddress);

  if (!session) {
    return NextResponse.json({ error: "Confidential session not found or expired." }, { status: 401 });
  }

  return session;
}

export function requireTradingWalletSession(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record?.session.walletAddress) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  return record.session;
}

export function assertMatchingTradingAndConfidentialWallets(
  tradingWalletAddress: string,
  confidentialWalletAddress: string,
) {
  if (tradingWalletAddress.toLowerCase() !== confidentialWalletAddress.toLowerCase()) {
    throw new Error("Connected wallet does not match the confidential session wallet.");
  }
}
