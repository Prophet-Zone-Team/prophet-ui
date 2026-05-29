import { NextResponse } from "next/server";

import { generateConfidentialIntent } from "@/server/confidential/operations";
import {
  assertMatchingTradingAndConfidentialWallets,
  confidentialErrorResponse,
  requireConfidentialSession,
  requireTradingWalletSession,
} from "@/server/confidential/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UnshieldIntentPayload {
  depositAddress?: string;
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

    const payload = (await request.json()) as UnshieldIntentPayload;

    if (!payload.depositAddress?.trim()) {
      return NextResponse.json({ error: "depositAddress is required." }, { status: 400 });
    }

    const intent = await generateConfidentialIntent(confidentialSession, payload.depositAddress.trim());

    return NextResponse.json({
      intent: intent.intent,
      ownerWalletAddress: tradingSession.walletAddress,
      privateAccountAddress: confidentialSession.intentsUserId,
      funderAddress: tradingSession.funderAddress,
    });
  } catch (error) {
    return confidentialErrorResponse(error);
  }
}
