import { NextResponse } from "next/server";

import { fetchClobTokenSigningMeta } from "@/server/trading/clob-user-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const tokenId = new URL(request.url).searchParams.get("tokenId")?.trim();

  if (!tokenId || !/^\d+$/.test(tokenId)) {
    return NextResponse.json({ error: "A numeric tokenId query parameter is required." }, { status: 400 });
  }

  try {
    return NextResponse.json(await fetchClobTokenSigningMeta(tokenId));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch CLOB market signing metadata.",
      },
      { status: 502 },
    );
  }
}
