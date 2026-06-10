import { NextResponse } from "next/server";

import type { TokenResponse as StableflowTokenResponse } from "@stableflow/core";

import {
  filterStableflowTokensForFundingNetworks,
  mapStableflowTokenToDepositToken,
  resolvePolygonUsdcDestinationAsset,
} from "@/lib/funding/stableflow";
import { getConfidentialTokens } from "@/server/confidential/one-click-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await getConfidentialTokens();
    const allTokens = raw as unknown as StableflowTokenResponse[];
    const filtered = filterStableflowTokensForFundingNetworks(allTokens);
    const tokens = filtered
      .map((token) => mapStableflowTokenToDepositToken(token))
      .filter((token): token is NonNullable<typeof token> => Boolean(token));
    const polygonUsdcDestinationAssetId = resolvePolygonUsdcDestinationAsset(allTokens)?.assetId;

    if (!polygonUsdcDestinationAssetId) {
      return NextResponse.json(
        { error: "Polygon USDC destination asset is not available." },
        { status: 502 },
      );
    }

    return NextResponse.json({ tokens, polygonUsdcDestinationAssetId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
