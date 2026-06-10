import "server-only";

import type { MarketPositionRecord } from "@/types/market";
import { serverFetch } from "@/server/trading/server-fetch";

const MARKET_POSITIONS_API_URL =
  "https://data-api.polymarket.com/v1/market-positions";

interface MarketPositionGroup {
  token: string;
  positions: MarketPositionRecord[];
}

export async function fetchMarketPositions({
  conditionId,
  status = "OPEN",
  sortBy = "TOKENS",
  sortDirection = "DESC",
  limit = 50,
  offset = 0,
}: {
  conditionId: string;
  status?: "OPEN" | "CLOSED" | "ALL";
  sortBy?: "TOKENS" | "CASH_PNL" | "REALIZED_PNL" | "TOTAL_PNL";
  sortDirection?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
}): Promise<MarketPositionRecord[]> {
  const market = conditionId.trim();

  if (!market) {
    return [];
  }

  const params = new URLSearchParams({
    market,
    status,
    sortBy,
    sortDirection,
    limit: String(Math.max(0, Math.min(limit, 500))),
    offset: String(Math.max(0, Math.min(offset, 10000))),
  });

  const response = await serverFetch(
    `${MARKET_POSITIONS_API_URL}?${params.toString()}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to fetch market positions: ${await readResponseError(response)}`,
    );
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter(isMarketPositionGroup)
    .flatMap((group) =>
      group.positions.filter(isMarketPositionRecord).map(normalizeMarketPosition),
    );
}

function normalizeMarketPosition(
  position: MarketPositionRecord,
): MarketPositionRecord {
  return {
    proxyWallet: position.proxyWallet,
    asset: position.asset,
    conditionId: position.conditionId,
    avgPrice: position.avgPrice,
    size: position.size,
    currPrice: position.currPrice,
    currentValue: position.currentValue,
    cashPnl: position.cashPnl,
    outcome: position.outcome,
    outcomeIndex: position.outcomeIndex,
    ...(position.name ? { name: position.name } : {}),
  };
}

function isMarketPositionGroup(value: unknown): value is MarketPositionGroup {
  return (
    typeof value === "object" &&
    value !== null &&
    "token" in value &&
    typeof value.token === "string" &&
    "positions" in value &&
    Array.isArray(value.positions)
  );
}

function isMarketPositionRecord(value: unknown): value is MarketPositionRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.proxyWallet === "string" &&
    typeof record.asset === "string" &&
    typeof record.conditionId === "string" &&
    typeof record.avgPrice === "number" &&
    typeof record.size === "number" &&
    typeof record.currPrice === "number" &&
    typeof record.currentValue === "number" &&
    typeof record.cashPnl === "number" &&
    typeof record.outcome === "string" &&
    typeof record.outcomeIndex === "number"
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
