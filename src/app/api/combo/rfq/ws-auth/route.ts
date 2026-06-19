import { NextResponse } from "next/server";

import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  if (!record.credentials) {
    return NextResponse.json(
      { error: "User CLOB credentials are required before combo RFQ WebSocket auth." },
      { status: 409 },
    );
  }

  if (!record.session.funderAddress) {
    return NextResponse.json({ error: "Deposit wallet is required." }, { status: 409 });
  }

  const funderAddress = record.session.funderAddress;

  return NextResponse.json({
    auth: {
      auth: {
        apiKey: record.credentials.key,
        secret: record.credentials.secret,
        passphrase: record.credentials.passphrase,
      },
      identity: {
        signer_address: funderAddress,
        maker_address: funderAddress,
        signature_type: record.session.signatureType ?? 3,
      },
    },
  });
}
