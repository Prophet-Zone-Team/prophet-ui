import { NextResponse } from "next/server";

import {
  pollComboRfqExecution,
  requestComboRfqQuote,
} from "@/server/combo/rfq-service";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";
import type { ComboRfqQuoteRequest } from "@/types/combo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.credentials) {
    return NextResponse.json(
      { error: "User CLOB credentials are required before combo RFQ requests." },
      { status: 409 },
    );
  }

  if (!record.session.funderAddress) {
    return NextResponse.json({ error: "Deposit wallet is required." }, { status: 409 });
  }

  const payload = (await request.json()) as ComboRfqQuoteRequest;
  const validationError = validateQuotePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const quote = await requestComboRfqQuote(payload, {
      walletAddress: record.session.walletAddress,
      funderAddress: record.session.funderAddress,
      credentials: record.credentials,
    });

    return NextResponse.json({ quote });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.credentials) {
    return NextResponse.json(
      { error: "User CLOB credentials are required before combo RFQ polling." },
      { status: 409 },
    );
  }

  if (!record.session.funderAddress) {
    return NextResponse.json({ error: "Deposit wallet is required." }, { status: 409 });
  }

  const rfqId = new URL(request.url).searchParams.get("rfqId")?.trim();

  if (!rfqId) {
    return NextResponse.json({ error: "rfqId is required." }, { status: 400 });
  }

  try {
    const result = await pollComboRfqExecution(rfqId, {
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

function validateQuotePayload(payload: ComboRfqQuoteRequest): string | undefined {
  if (!Array.isArray(payload.legs) || payload.legs.length === 0) {
    return "At least one combo leg is required.";
  }

  if (!Number.isFinite(payload.bidAmountUsd) || payload.bidAmountUsd <= 0) {
    return "bidAmountUsd must be greater than zero.";
  }

  for (const leg of payload.legs) {
    if (!leg.legPositionId?.trim()) {
      return "Each combo leg must include legPositionId.";
    }
  }

  return undefined;
}
