import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ready: false,
    missing: [],
    signatureType: 3,
    enabled: false,
    consumerTradingEnabled: false,
    message: "Legacy server-wallet order submission is disabled for public bid flows. Use /api/trading/* for user-owned trading sessions.",
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Legacy server-wallet order submission has been retired from the public bid route. Create a user trading session and submit through /api/trading/orders.",
    },
    { status: 410 },
  );
}
