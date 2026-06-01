import { NextResponse } from "next/server";

import Big from "big.js";
import type { TokenResponse as StableflowTokenResponse } from "@stableflow/core";

import { resolvePolygonUsdcDestinationAsset } from "@/lib/funding/stableflow";
import {
  getConfidentialBalances,
  getConfidentialTokens,
  type OneClickBalanceEntry,
} from "@/server/confidential/one-click-client";
import {
  applyRefreshedCookie,
  requireConfidentialAccess,
} from "@/server/confidential/route-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireConfidentialAccess(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const [tokensRaw, balancesPayload] = await Promise.all([
      getConfidentialTokens(),
      getConfidentialBalances(auth.access.accessToken),
    ]);

    const tokens = tokensRaw as unknown as StableflowTokenResponse[];
    const polygonUsdc = resolvePolygonUsdcDestinationAsset(tokens);

    if (!polygonUsdc) {
      return NextResponse.json(
        { error: "Polygon USDC asset is not available." },
        { status: 502 },
      );
    }

    const entry = (balancesPayload.balances ?? []).find((item) =>
      matchesAsset(item, polygonUsdc.assetId),
    );
    const balanceBaseUnits = readBalanceBaseUnits(entry);
    const balance = Big(balanceBaseUnits)
      .div(Big(10).pow(polygonUsdc.decimals))
      .toString();
    const usd = Big(balance).times(polygonUsdc.price ?? 1).toNumber();

    return applyRefreshedCookie(
      NextResponse.json({
        usdc: {
          balanceBaseUnits,
          balance: Number(balance),
          usd,
        },
      }),
      auth.access,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}

function matchesAsset(entry: OneClickBalanceEntry, assetId: string): boolean {
  return entry.assetId === assetId || entry.tokenId === assetId;
}

function readBalanceBaseUnits(entry: OneClickBalanceEntry | undefined): string {
  const value = entry?.available ?? entry?.amount ?? entry?.balance ?? "0";
  return /^\d+$/.test(value) ? value : "0";
}
