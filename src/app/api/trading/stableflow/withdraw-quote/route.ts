import { NextResponse } from "next/server";

import { buildStableflowWithdrawQuoteRequest } from "@/lib/funding/stableflow-withdraw";
import {
  isValidEvmAddress,
  isValidStableflowRecipientAddress,
} from "@/lib/funding/recipient-validation";
import { getStableflowQuote } from "@/server/trading/stableflow";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StableflowWithdrawQuotePayload {
  destinationAssetId?: string;
  amountBaseUnits?: string;
  recipient?: string;
  dry?: boolean;
  destinationBlockchain?: string;
}

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.session.funderAddress) {
    return NextResponse.json({ error: "Trading session is missing a deposit wallet." }, { status: 409 });
  }

  const payload = (await request.json()) as StableflowWithdrawQuotePayload;
  const validationError = validatePayload(payload, record.session.funderAddress);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const quoteRequest = buildStableflowWithdrawQuoteRequest({
      destinationAssetId: payload.destinationAssetId!,
      amountBaseUnits: payload.amountBaseUnits!,
      refundTo: record.session.funderAddress,
      recipient: payload.recipient!,
      dry: payload.dry ?? false,
    });
    const quote = await getStableflowQuote(quoteRequest);

    if (!payload.dry && !quote.quote.depositAddress) {
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

function validatePayload(payload: StableflowWithdrawQuotePayload, funderAddress: string): string | undefined {
  if (!payload.destinationAssetId?.trim()) {
    return "destinationAssetId is required.";
  }

  if (!payload.amountBaseUnits?.trim() || !/^\d+$/.test(payload.amountBaseUnits.trim())) {
    return "amountBaseUnits must be a positive integer string.";
  }

  const destinationBlockchain =
    payload.destinationBlockchain?.trim() ||
    inferBlockchainFromAssetId(payload.destinationAssetId);

  if (!payload.recipient?.trim()) {
    return "recipient is required.";
  }

  if (!isValidStableflowRecipientAddress(destinationBlockchain, payload.recipient)) {
    return "recipient must be a valid address for the destination chain.";
  }

  if (!funderAddress || !isValidEvmAddress(funderAddress)) {
    return "Trading session is missing a valid deposit wallet.";
  }

  return undefined;
}

function inferBlockchainFromAssetId(assetId: string): string {
  if (assetId.startsWith("1cs_v1:sol:")) {
    return "sol";
  }

  if (assetId.includes(":tron") || assetId.includes("tron-")) {
    return "tron";
  }

  if (assetId.startsWith("nep141:") && !assetId.includes(":sol") && !assetId.includes(":tron")) {
    return "near";
  }

  return "pol";
}
