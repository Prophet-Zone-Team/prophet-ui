import { NextResponse } from "next/server";

import { getFootballMatchBySlug } from "@/data/providers/football-matches";
import {
  fetchFixtureLivePricesForTab,
  isValidGameMarketTab,
} from "@/lib/market/fixture-live-prices";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const matchSlug = url.searchParams.get("matchSlug")?.trim();
  const tabParam = url.searchParams.get("tab")?.trim();
  const lineKey = url.searchParams.get("lineKey")?.trim() || undefined;

  if (!matchSlug) {
    return NextResponse.json({ error: "matchSlug is required." }, { status: 400 });
  }

  if (!tabParam || !isValidGameMarketTab(tabParam)) {
    return NextResponse.json(
      { error: "tab must be one of moneyline, totals, spreads, halftime, top_scores." },
      { status: 400 },
    );
  }

  try {
    const match = await getFootballMatchBySlug(matchSlug);

    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const payload = await fetchFixtureLivePricesForTab(match, tabParam, lineKey);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
