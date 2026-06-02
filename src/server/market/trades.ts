import "server-only";

import type { MarketTradeRecord } from "@/types/market";
import { serverFetch } from "@/server/trading/server-fetch";

const TRADES_API_URL = "https://data-api.polymarket.com/trades";

export async function fetchMarketTrades({
  conditionId,
  limit = 20,
  offset = 0,
  filterType = "CASH",
  filterAmount = 1,
  takerOnly = true,
}: {
  conditionId: string;
  limit?: number;
  offset?: number;
  filterType?: "CASH" | "TOKENS";
  filterAmount?: number;
  takerOnly?: boolean;
}): Promise<MarketTradeRecord[]> {
  const market = conditionId.trim();

  if (!market) {
    return [];
  }

  const params = new URLSearchParams({
    market,
    limit: String(Math.max(1, Math.min(limit, 500))),
    offset: String(Math.max(0, Math.min(offset, 10000))),
    filterType,
    filterAmount: String(Math.max(0, filterAmount)),
    takerOnly: String(takerOnly),
  });

  const response = await serverFetch(`${TRADES_API_URL}?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Unable to fetch market trades: ${await readResponseError(response)}`,
    );
  }

  const payload = (await response.json()) as unknown;
  return Array.isArray(payload)
    ? payload.filter(isMarketTradeRecord).map(normalizeMarketTradeRecord)
    : [];
}

function normalizeMarketTradeRecord(trade: MarketTradeRecord): MarketTradeRecord {
  return {
    proxyWallet: trade.proxyWallet,
    side: trade.side,
    asset: trade.asset,
    conditionId: trade.conditionId,
    size: trade.size,
    price: trade.price,
    timestamp: trade.timestamp,
    outcome: trade.outcome,
    outcomeIndex: trade.outcomeIndex,
    ...(trade.name ? { name: trade.name } : {}),
    ...(trade.pseudonym ? { pseudonym: trade.pseudonym } : {}),
    ...(trade.transactionHash ? { transactionHash: trade.transactionHash } : {}),
  };
}

function isMarketTradeRecord(value: unknown): value is MarketTradeRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.proxyWallet === "string" &&
    (record.side === "BUY" || record.side === "SELL") &&
    typeof record.asset === "string" &&
    typeof record.conditionId === "string" &&
    typeof record.size === "number" &&
    typeof record.price === "number" &&
    typeof record.timestamp === "number" &&
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
