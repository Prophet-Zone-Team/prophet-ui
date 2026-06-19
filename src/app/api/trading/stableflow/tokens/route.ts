import { NextResponse } from "next/server";

import {
  filterStableflowTokensForFundingNetworks,
  mapStableflowTokenToDepositToken,
  resolvePolygonUsdcDestinationAsset,
} from "@/lib/funding/stableflow";
import { getStableflowTokens } from "@/server/trading/stableflow";
import { getTradingSessionFromCookie } from "@/server/trading/session-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const record = getTradingSessionFromCookie(request.headers.get("cookie"));

  if (!record) {
    return NextResponse.json({ error: "Trading session not found." }, { status: 401 });
  }

  try {
    const apiTokens = await getStableflowTokens();
    const filtered = filterStableflowTokensForFundingNetworks(apiTokens);
    const tokens = filtered
      .map((token) => mapStableflowTokenToDepositToken(token))
      .filter((token): token is NonNullable<typeof token> => Boolean(token));
    const polygonUsdcDestinationAssetId = resolvePolygonUsdcDestinationAsset(apiTokens)?.assetId;

    if (!polygonUsdcDestinationAssetId) {
      return NextResponse.json(
        { error: "Polygon USDC destination asset is not available from Stableflow." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      tokens,
      polygonUsdcDestinationAssetId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
