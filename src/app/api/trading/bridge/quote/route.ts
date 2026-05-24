import { NextResponse } from "next/server";

import { fetchBridgeQuote } from "@/server/trading/bridge";
import type { BridgeQuoteRequest } from "@/types/funding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

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

  if (!body.fromTokenAddress?.trim() || !EVM_ADDRESS_PATTERN.test(body.fromTokenAddress.trim())) {
    return "fromTokenAddress must be a valid EVM address.";
  }

  if (!body.toTokenAddress?.trim() || !EVM_ADDRESS_PATTERN.test(body.toTokenAddress.trim())) {
    return "toTokenAddress must be a valid EVM address.";
  }

  if (!body.recipientAddress?.trim() || !EVM_ADDRESS_PATTERN.test(body.recipientAddress.trim())) {
    return "recipientAddress must be a valid EVM address.";
  }

  return undefined;
}
