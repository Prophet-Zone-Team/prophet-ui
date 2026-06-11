import { NextResponse } from "next/server";

import type { TokenResponse as StableflowTokenResponse } from "@stableflow/core";

import { buildConfidentialWithdrawQuoteRequest } from "@/lib/funding/confidential";
import { resolvePolygonUsdcDestinationAsset } from "@/lib/funding/stableflow";
import {
  getConfidentialQuote,
  getConfidentialTokens,
} from "@/server/confidential/one-click-client";
import { formatConfidentialApiErrorMessage } from "@/server/confidential/error-messages";
import {
  applyRefreshedCookie,
  requireConfidentialAccess,
} from "@/server/confidential/route-helpers";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WithdrawQuotePayload {
  amountBaseUnits?: string;
}

export async function POST(request: Request) {
  const auth = await requireConfidentialAccess(request);

  if (!auth.ok) {
    return auth.response;
  }

  const trading = getTradingSessionFromCookie(request.headers.get("cookie"));
  const funderAddress = trading?.session.funderAddress;

  if (!funderAddress) {
    return NextResponse.json(
      { error: "A connected Polymarket deposit wallet is required to unshield." },
      { status: 409 },
    );
  }

  const payload = (await request.json().catch(() => ({}))) as WithdrawQuotePayload;

  if (!payload.amountBaseUnits?.trim() || !/^\d+$/.test(payload.amountBaseUnits.trim())) {
    return NextResponse.json(
      { error: "amountBaseUnits must be a positive integer string." },
      { status: 400 },
    );
  }

  try {
    const tokens = (await getConfidentialTokens()) as unknown as StableflowTokenResponse[];
    const polygonUsdc = resolvePolygonUsdcDestinationAsset(tokens);

    if (!polygonUsdc) {
      return NextResponse.json(
        { error: "Polygon USDC asset is not available." },
        { status: 502 },
      );
    }

    const quoteRequest = buildConfidentialWithdrawQuoteRequest({
      originAssetId: polygonUsdc.assetId,
      destinationAssetId: polygonUsdc.assetId,
      amountBaseUnits: payload.amountBaseUnits.trim(),
      refundTo: auth.access.session.intentsUserId,
      recipient: funderAddress,
    });
    const quote = await getConfidentialQuote(quoteRequest, auth.access.accessToken);

    if (!quote.quote?.depositAddress) {
      return NextResponse.json(
        { error: "Withdraw quote did not return a deposit address." },
        { status: 502 },
      );
    }

    return applyRefreshedCookie(NextResponse.json({ quote }), auth.access);
  } catch (error) {
    const errorMessage = formatConfidentialApiErrorMessage(
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { error: errorMessage },
      { status: 502 },
    );
  }
}
