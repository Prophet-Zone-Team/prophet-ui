import "server-only";

import Big from "big.js";

import { oneClickGetBalances, oneClickGetTokens } from "@/server/confidential/one-click-client";
import { POLYGON_USDC_NATIVE } from "@/lib/funding/stableflow";
import type { ConfidentialSessionRecord } from "@/server/confidential/session-store";

export interface ResolvedConfidentialBalances {
  balances: Array<{ tokenId: string; available: string; source?: string }>;
  usdcAssetId?: string;
  usdcDecimals: number;
  usdcBalanceBaseUnits: string;
  usdcBalanceFormatted: string;
  privateBalanceUsd: number;
}

export async function resolveConfidentialBalances(
  session: ConfidentialSessionRecord,
): Promise<ResolvedConfidentialBalances> {
  const [balancePayload, tokens] = await Promise.all([
    oneClickGetBalances(session),
    oneClickGetTokens(session),
  ]);

  const polygonUsdc = tokens.find(
    (token) =>
      token.blockchain === "pol" &&
      token.symbol === "USDC" &&
      token.contractAddress?.toLowerCase() === POLYGON_USDC_NATIVE,
  );

  const usdcAssetId = polygonUsdc?.assetId;
  const usdcDecimals = polygonUsdc?.decimals ?? 6;
  const balances = balancePayload.balances ?? [];
  const usdcEntry = usdcAssetId
    ? balances.find((entry) => entry.tokenId === usdcAssetId)
    : balances.find((entry) => entry.tokenId.toLowerCase().includes("usdc"));

  const usdcBalanceBaseUnits = usdcEntry?.available ?? "0";
  const usdcBalanceFormatted = formatTokenAmount(usdcBalanceBaseUnits, usdcDecimals);
  const privateBalanceUsd = polygonUsdc?.price
    ? Big(usdcBalanceFormatted).times(polygonUsdc.price).toNumber()
    : Number(usdcBalanceFormatted);

  const normalizedBalances =
    usdcAssetId && !usdcEntry
      ? [
          ...balances,
          {
            tokenId: usdcAssetId,
            available: "0",
            source: "private",
          },
        ]
      : balances;

  return {
    balances: normalizedBalances,
    usdcAssetId,
    usdcDecimals,
    usdcBalanceBaseUnits,
    usdcBalanceFormatted,
    privateBalanceUsd,
  };
}

function formatTokenAmount(baseUnits: string, decimals: number) {
  try {
    return Big(baseUnits || "0")
      .div(10 ** decimals)
      .toFixed(decimals, Big.roundDown);
  } catch {
    return "0";
  }
}
