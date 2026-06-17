import { NextResponse } from "next/server";

import { buildConfidentialTopupQuoteRequest } from "@/lib/funding/confidential";
import { isValidStableflowRefundAddress } from "@/lib/funding/recipient-validation";
import { getConfidentialQuote } from "@/server/confidential/one-click-client";
import {
  applyRefreshedCookie,
  requireConfidentialAccess,
} from "@/server/confidential/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface QuotePayload {
  originAssetId?: string;
  destinationAssetId?: string;
  amountBaseUnits?: string;
  refundTo?: string;
  originBlockchain?: string;
}

export async function POST(request: Request) {
  const auth = await requireConfidentialAccess(request);

  if (!auth.ok) {
    return auth.response;
  }

  const payload = (await request.json().catch(() => ({}))) as QuotePayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const quoteRequest = buildConfidentialTopupQuoteRequest({
      originAssetId: payload.originAssetId!,
      destinationAssetId: payload.destinationAssetId!,
      amountBaseUnits: payload.amountBaseUnits!,
      refundTo: payload.refundTo!,
      recipient: auth.access.session.intentsUserId,
    });
    const quote = await getConfidentialQuote(quoteRequest, auth.access.accessToken);

    if (!quote.quote?.depositAddress) {
      return NextResponse.json(
        { error: "Quote did not return a deposit address." },
        { status: 502 },
      );
    }

    return applyRefreshedCookie(NextResponse.json({ quote }), auth.access);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}

function validatePayload(payload: QuotePayload): string | undefined {
  if (!payload.originAssetId?.trim()) {
    return "originAssetId is required.";
  }

  if (!payload.destinationAssetId?.trim()) {
    return "destinationAssetId is required.";
  }

  if (!payload.amountBaseUnits?.trim() || !/^\d+$/.test(payload.amountBaseUnits.trim())) {
    return "amountBaseUnits must be a positive integer string.";
  }

  const originBlockchain =
    payload.originBlockchain?.trim() ||
    inferBlockchainFromAssetId(payload.originAssetId);

  if (!payload.refundTo?.trim()) {
    return "refundTo is required.";
  }

  if (!isValidStableflowRefundAddress(originBlockchain, payload.refundTo)) {
    return "refundTo must be a valid address for the origin chain.";
  }

  return undefined;
}

function inferBlockchainFromAssetId(assetId: string): string {
  if (assetId.startsWith("1cs_v1:sol:")) {
    return "sol";
  }

  if (assetId.includes(":tron")) {
    return "tron";
  }

  if (assetId.startsWith("nep141:") && !assetId.includes(":sol") && !assetId.includes(":tron")) {
    return "near";
  }

  return "pol";
}
