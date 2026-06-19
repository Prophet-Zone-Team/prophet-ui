import { NextResponse } from "next/server";

import {
  isValidBridgeRecipientAddress,
  isValidBridgeTokenAddress,
} from "@/lib/funding/recipient-validation";
import { fetchBridgeQuote } from "@/server/trading/bridge";
import type { BridgeQuoteRequest } from "@/types/funding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BridgeQuoteRequest;
    const validationError = validateQuoteRequest(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const quote = await fetchBridgeQuote(body);

    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}

function validateQuoteRequest(body: BridgeQuoteRequest): string | undefined {
  if (!body.fromAmountBaseUnit?.trim() || !/^\d+$/.test(body.fromAmountBaseUnit.trim())) {
    return "fromAmountBaseUnit must be a positive integer string.";
  }

  if (!body.fromChainId?.trim() || !body.toChainId?.trim()) {
    return "fromChainId and toChainId are required.";
  }

  const fromChainId = body.fromChainId.trim();
  const toChainId = body.toChainId.trim();

  if (
    !body.fromTokenAddress?.trim() ||
    !isValidBridgeTokenAddress(fromChainId, body.fromTokenAddress)
  ) {
    return `fromTokenAddress must be a valid address for chain ${fromChainId}.`;
  }

  if (
    !body.toTokenAddress?.trim() ||
    !isValidBridgeTokenAddress(toChainId, body.toTokenAddress)
  ) {
    return `toTokenAddress must be a valid address for chain ${toChainId}.`;
  }

  if (
    !body.recipientAddress?.trim() ||
    !isValidBridgeRecipientAddress(toChainId, body.recipientAddress)
  ) {
    return `recipientAddress must be a valid address for chain ${toChainId}.`;
  }

  return undefined;
}
