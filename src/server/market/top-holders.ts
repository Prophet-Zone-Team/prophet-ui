import "server-only";

import type { MarketTopHolder, MarketTopHolderGroup } from "@/types/market";
import { serverFetch } from "@/server/trading/server-fetch";

const HOLDERS_API_URL = "https://data-api.polymarket.com/holders";

export type { MarketTopHolder, MarketTopHolderGroup };

export async function fetchMarketTopHolders({
  conditionIds,
  limit = 20,
  minBalance = 1
}: {
  conditionIds: string[];
  limit?: number;
  minBalance?: number;
}): Promise<MarketTopHolderGroup[]> {
  const market = conditionIds.filter(Boolean).join(",");

  if (!market) {
    return [];
  }

  const params = new URLSearchParams({
    market,
    limit: String(Math.max(0, Math.min(limit, 20))),
    minBalance: String(Math.max(0, Math.min(minBalance, 999999)))
  });

  const response = await serverFetch(
    `${HOLDERS_API_URL}?${params.toString()}`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to fetch market holders: ${await readResponseError(response)}`
    );
  }

  const payload = (await response.json()) as unknown;
  return Array.isArray(payload)
    ? payload.filter(isMarketTopHolderGroup).map(normalizeMarketTopHolderGroup)
    : [];
}

function normalizeMarketTopHolderGroup(
  group: MarketTopHolderGroup
): MarketTopHolderGroup {
  return {
    token: group.token,
    holders: group.holders.filter(isMarketTopHolder)
  };
}

function isMarketTopHolderGroup(value: unknown): value is MarketTopHolderGroup {
  return (
    typeof value === "object" &&
    value !== null &&
    "token" in value &&
    typeof value.token === "string" &&
    "holders" in value &&
    Array.isArray(value.holders)
  );
}

function isMarketTopHolder(value: unknown): value is MarketTopHolder {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.proxyWallet === "string" &&
    typeof record.amount === "number" &&
    typeof record.outcomeIndex === "number" &&
    typeof record.asset === "string"
  );
}

async function readResponseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}
