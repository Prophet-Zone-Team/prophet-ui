import { NextResponse } from "next/server";

import { resolveConfidentialBalances } from "@/server/confidential/balances";
import { buildUnshieldQuoteParams, createConfidentialQuote } from "@/server/confidential/operations";
import {
  assertMatchingTradingAndConfidentialWallets,
  confidentialErrorResponse,
  requireConfidentialSession,
  requireTradingWalletSession,
} from "@/server/confidential/route-utils";
import { oneClickGetTokens } from "@/server/confidential/one-click-client";
import { POLYGON_USDC_NATIVE } from "@/lib/funding/stableflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UnshieldQuotePayload {
  amountBaseUnits?: string;
}

export async function POST(request: Request) {
  try {
    const tradingSession = requireTradingWalletSession(request);

    if (tradingSession instanceof NextResponse) {
      return tradingSession;
    }

    if (!tradingSession.funderAddress) {
      return NextResponse.json({ error: "Trading session is missing a deposit wallet." }, { status: 409 });
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

    const payload = (await request.json()) as UnshieldQuotePayload;

    const amountBaseUnits = payload.amountBaseUnits?.trim() ?? "";

    if (!amountBaseUnits || !/^\d+$/.test(amountBaseUnits) || amountBaseUnits === "0") {
      return NextResponse.json({ error: "amountBaseUnits must be a positive integer string." }, { status: 400 });
    }

    const confidentialBalances = await resolveConfidentialBalances(confidentialSession);

    if (BigInt(amountBaseUnits) > BigInt(confidentialBalances.usdcBalanceBaseUnits || "0")) {
      return NextResponse.json({ error: "Transfer amount exceeds private USDC balance." }, { status: 400 });
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
      buildUnshieldQuoteParams({
        walletAddress: tradingSession.walletAddress,
        assetId: polygonUsdc.assetId,
        amountBaseUnits,
        funderAddress: tradingSession.funderAddress,
      }),
    );

    return NextResponse.json({
      depositAddress: quote.depositAddress,
      depositMemo: quote.depositMemo,
      quote: quote.quote,
      ownerWalletAddress: tradingSession.walletAddress,
      privateAccountAddress: confidentialSession.intentsUserId,
      funderAddress: tradingSession.funderAddress,
      polygonUsdcAssetId: polygonUsdc.assetId,
    });
  } catch (error) {
    return confidentialErrorResponse(error);
  }
}
