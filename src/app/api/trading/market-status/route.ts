import { NextResponse } from "next/server";

import { fetchGammaMarketAcceptingOrders } from "@/server/trading/gamma-market-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? undefined;
  const conditionId = url.searchParams.get("conditionId") ?? undefined;

  if (!slug && !conditionId) {
    return NextResponse.json(
      { error: "A slug or conditionId query parameter is required." },
      { status: 400 }
    );
  }

  try {
    const acceptingOrders = await fetchGammaMarketAcceptingOrders({
      slug,
      conditionId
    });

    return NextResponse.json({ acceptingOrders });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to fetch Polymarket market status."
      },
      { status: 502 }
    );
  }
}
