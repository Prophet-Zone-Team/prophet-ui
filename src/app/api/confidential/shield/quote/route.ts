import { NextResponse } from "next/server";

import { buildShieldQuoteParams, createConfidentialQuote } from "@/server/confidential/operations";
import {
  confidentialErrorResponse,
  requireConfidentialSession,
  requireTradingWalletSession,
} from "@/server/confidential/route-utils";
import { oneClickGetTokens } from "@/server/confidential/one-click-client";
import { POLYGON_USDC_NATIVE } from "@/lib/funding/stableflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ShieldQuotePayload {
  amountBaseUnits?: string;
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

    const payload = (await request.json()) as ShieldQuotePayload;

    if (!payload.amountBaseUnits?.trim() || !/^\d+$/.test(payload.amountBaseUnits.trim())) {
      return NextResponse.json({ error: "amountBaseUnits must be a positive integer string." }, { status: 400 });
    }

    const tokens = await oneClickGetTokens(confidentialSession);
    const polygonUsdc = tokens.find(
      (token) =>
        token.blockchain === "pol" &&
        token.symbol === "USDC" &&
        token.contractAddress?.toLowerCase() === POLYGON_USDC_NATIVE,
    );

    if (!polygonUsdc?.assetId) {
      return NextResponse.json({ error: "Polygon USDC asset is not available from 1Click." }, { status: 502 });
    }

    const quote = await createConfidentialQuote(
      confidentialSession,
      buildShieldQuoteParams({
        walletAddress: tradingSession.walletAddress,
        assetId: polygonUsdc.assetId,
        amountBaseUnits: payload.amountBaseUnits.trim(),
      }),
    );

    return NextResponse.json({
      depositAddress: quote.depositAddress,
      depositMemo: quote.depositMemo,
      quote: quote.quote,
      ownerWalletAddress: tradingSession.walletAddress,
      privateAccountAddress: confidentialSession.intentsUserId,
      polygonUsdcAssetId: polygonUsdc.assetId,
    });
  } catch (error) {
    return confidentialErrorResponse(error);
  }
}
