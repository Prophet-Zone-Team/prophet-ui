import { NextResponse } from "next/server";

import { STABLEFLOW_EXTRA_TOKENS } from "@/config/funding/stableflow-extra-tokens";
import {
  filterStableflowTokensForFundingNetworks,
  mapStableflowTokenToDepositToken,
  mergeStableflowTokens,
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
    const allTokens = mergeStableflowTokens(apiTokens, STABLEFLOW_EXTRA_TOKENS);
    const filtered = filterStableflowTokensForFundingNetworks(allTokens);
    const tokens = filtered
      .map((token) => mapStableflowTokenToDepositToken(token))
      .filter((token): token is NonNullable<typeof token> => Boolean(token));
    const polygonUsdcDestinationAssetId = resolvePolygonUsdcDestinationAsset(allTokens)?.assetId;

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
