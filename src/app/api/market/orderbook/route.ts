import { NextResponse } from "next/server";

import { fetchMarketOrderbook } from "@/server/market/clob-orderbook";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const tokenId = new URL(request.url).searchParams.get("tokenId");

  if (!tokenId) {
    return NextResponse.json({ error: "tokenId is required." }, { status: 400 });
  }

  try {
    const orderbook = await fetchMarketOrderbook(tokenId);

    return NextResponse.json({ orderbook });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 502 }
    );
  }
}
