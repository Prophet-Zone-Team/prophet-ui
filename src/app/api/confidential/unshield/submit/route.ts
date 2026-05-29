import { NextResponse } from "next/server";

import { submitConfidentialIntent } from "@/server/confidential/operations";
import {
  assertMatchingTradingAndConfidentialWallets,
  confidentialErrorResponse,
  requireConfidentialSession,
  requireTradingWalletSession,
} from "@/server/confidential/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UnshieldSubmitPayload {
  depositAddress?: string;
  signedData?: unknown;
}

export async function POST(request: Request) {
  try {
    const tradingSession = requireTradingWalletSession(request);

    if (tradingSession instanceof NextResponse) {
      return tradingSession;
    }

    const confidentialSession = await requireConfidentialSession(
      request,
      tradingSession.walletAddress,
    );

    if (confidentialSession instanceof NextResponse) {
      return confidentialSession;
    }

    assertMatchingTradingAndConfidentialWallets(
      tradingSession.walletAddress,
      confidentialSession.walletAddress,
    );

    const payload = (await request.json()) as UnshieldSubmitPayload;

    if (!payload.depositAddress?.trim()) {
      return NextResponse.json({ error: "depositAddress is required." }, { status: 400 });
    }

    if (!payload.signedData) {
      return NextResponse.json({ error: "signedData is required." }, { status: 400 });
    }

    await submitConfidentialIntent(confidentialSession, payload.signedData);

    return NextResponse.json({
      depositAddress: payload.depositAddress.trim(),
      ok: true,
    });
  } catch (error) {
    return confidentialErrorResponse(error);
  }
}
