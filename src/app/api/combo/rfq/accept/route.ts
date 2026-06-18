import { NextResponse } from "next/server";

import { acceptComboRfqQuote } from "@/server/combo/rfq-service";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";
import type { ComboRfqAcceptRequest } from "@/types/combo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.credentials) {
    return NextResponse.json(
      { error: "User CLOB credentials are required before combo accept." },
      { status: 409 },
    );
  }

  if (!record.session.funderAddress) {
    return NextResponse.json({ error: "Deposit wallet is required." }, { status: 409 });
  }

  const payload = (await request.json()) as ComboRfqAcceptRequest;
  const validationError = validateAcceptPayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const result = await acceptComboRfqQuote(payload, {
      walletAddress: record.session.walletAddress,
      funderAddress: record.session.funderAddress,
      credentials: record.credentials,
    });

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}

function validateAcceptPayload(payload: ComboRfqAcceptRequest): string | undefined {
  if (!payload.rfqId?.trim() || !payload.quoteId?.trim()) {
    return "rfqId and quoteId are required.";
  }

  if (!payload.signedOrder?.signature?.trim()) {
    return "signedOrder.signature is required.";
  }

  return undefined;
}
