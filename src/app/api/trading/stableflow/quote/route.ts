import { NextResponse } from "next/server";

import { buildStableflowQuoteRequest } from "@/lib/funding/stableflow";
import {
  isValidEvmAddress,
  isValidStableflowRefundAddress,
} from "@/lib/funding/recipient-validation";
import { getStableflowQuote } from "@/server/trading/stableflow";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";
import { QuoteRequest } from "@stableflow/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StableflowQuotePayload {
  originAssetId?: string;
  destinationAssetId?: string;
  amountBaseUnits?: string;
  refundTo?: string;
  recipient?: string;
  swapType?: QuoteRequest.swapType;
  originBlockchain?: string;
}

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.session.funderAddress) {
    return NextResponse.json({ error: "Trading session is missing a deposit wallet." }, { status: 409 });
  }

  const payload = (await request.json()) as StableflowQuotePayload;
  const validationError = validatePayload(payload, record.session.funderAddress);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const quoteRequest = buildStableflowQuoteRequest({
      originAssetId: payload.originAssetId!,
      destinationAssetId: payload.destinationAssetId!,
      amountBaseUnits: payload.amountBaseUnits!,
      refundTo: payload.refundTo!,
      recipient: payload.recipient!,
      swapType: payload.swapType,
    });
    const quote = await getStableflowQuote(quoteRequest);

    if (!quote.quote.depositAddress) {
      return NextResponse.json({ error: "Stableflow quote did not return a deposit address." }, { status: 502 });
    }

    return NextResponse.json({ quote });
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("Failed to get quote")) {
      errorMessage = "Insufficient liquidity";
    }
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 502 },
    );
  }
}

function validatePayload(payload: StableflowQuotePayload, funderAddress: string): string | undefined {
  if (!payload.originAssetId?.trim()) {
    return "originAssetId is required.";
  }

  if (!payload.destinationAssetId?.trim()) {
    return "destinationAssetId is required.";
  }

  if (!payload.amountBaseUnits?.trim() || !/^\d+$/.test(payload.amountBaseUnits.trim())) {
    return "amountBaseUnits must be a positive integer string.";
  }

  const originBlockchain = payload.originBlockchain?.trim() || inferBlockchainFromAssetId(payload.originAssetId);
  const isFlexInput = payload.swapType === QuoteRequest.swapType.FLEX_INPUT;

  if (!payload.refundTo?.trim()) {
    return "refundTo is required.";
  }

  if (!isFlexInput && !isValidStableflowRefundAddress(originBlockchain, payload.refundTo)) {
    return "refundTo must be a valid address for the origin chain.";
  }

  if (!payload.recipient?.trim() || !isValidEvmAddress(payload.recipient.trim())) {
    return "recipient must be a valid EVM address.";
  }

  if (payload.recipient.trim().toLowerCase() !== funderAddress.toLowerCase()) {
    return "recipient must match the session deposit wallet.";
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
