import "server-only";

import { getTradingHost } from "@/server/trading/clob-auth";
import { serverFetch } from "@/server/trading/server-fetch";

export interface ClobPriceHistoryPoint {
  t: number;
  p: number;
}

export type FixtureHistoryInterval = "1h" | "1d" | "1w" | "1m" | "max" | "all";

export interface FetchTokenPriceHistoryOptions {
  interval?: FixtureHistoryInterval;
  fidelity?: number;
  startTs?: number;
  endTs?: number;
}

export interface FetchBatchTokenPriceHistoryOptions extends FetchTokenPriceHistoryOptions {
  markets: string[];
}

interface PricesHistoryResponse {
  history?: ClobPriceHistoryPoint[];
}

interface BatchPricesHistoryResponse {
  history?: Record<string, ClobPriceHistoryPoint[]>;
}

function normalizeHistoryPoint(value: unknown): ClobPriceHistoryPoint | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as { t?: unknown; p?: unknown };
  const t = Number(record.t);
  const p = Number(record.p);

  if (!Number.isFinite(t) || !Number.isFinite(p)) {
    return undefined;
  }

  return { t, p };
}

function normalizeHistoryPoints(values: unknown): ClobPriceHistoryPoint[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(normalizeHistoryPoint)
    .filter((point): point is ClobPriceHistoryPoint => point !== undefined)
    .sort((left, right) => left.t - right.t);
}

function buildHistoryQueryParams(
  tokenId: string,
  options: FetchTokenPriceHistoryOptions = {},
): URLSearchParams {
  const params = new URLSearchParams({ market: tokenId });

  if (options.interval) {
    params.set("interval", options.interval);
  }

  if (options.fidelity !== undefined) {
    params.set("fidelity", String(options.fidelity));
  }

  if (options.startTs !== undefined) {
    params.set("startTs", String(options.startTs));
  }

  if (options.endTs !== undefined) {
    params.set("endTs", String(options.endTs));
  }

  return params;
}

export async function fetchTokenPriceHistory(
  tokenId: string,
  options: FetchTokenPriceHistoryOptions = {},
): Promise<ClobPriceHistoryPoint[]> {
  const params = buildHistoryQueryParams(tokenId, options);
  const response = await serverFetch(`${getTradingHost()}/prices-history?${params}`, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`CLOB prices-history request failed (${response.status}).`);
  }

  const payload = (await response.json()) as PricesHistoryResponse;
  return normalizeHistoryPoints(payload.history);
}

export async function fetchBatchTokenPriceHistory(
  options: FetchBatchTokenPriceHistoryOptions,
): Promise<Map<string, ClobPriceHistoryPoint[]>> {
  const tokenIds = [...new Set(options.markets.filter(Boolean))];

  if (tokenIds.length === 0) {
    return new Map();
  }

  if (tokenIds.length === 1) {
    const tokenId = tokenIds[0]!;

    try {
      const history = await fetchTokenPriceHistory(tokenId, options);
      return new Map([[tokenId, history]]);
    } catch {
      return new Map([[tokenId, []]]);
    }
  }

  const body: Record<string, unknown> = {
    markets: tokenIds,
  };

  if (options.interval) {
    body.interval = options.interval;
  }

  if (options.fidelity !== undefined) {
    body.fidelity = options.fidelity;
  }

  if (options.startTs !== undefined) {
    body.start_ts = options.startTs;
  }

  if (options.endTs !== undefined) {
    body.end_ts = options.endTs;
  }

  const response = await serverFetch(`${getTradingHost()}/batch-prices-history`, {
    method: "POST",
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return fetchTokenHistoriesIndividually(tokenIds, options);
  }

  const payload = (await response.json()) as BatchPricesHistoryResponse;
  const historyByToken = payload.history ?? {};
  const result = new Map<string, ClobPriceHistoryPoint[]>();

  for (const tokenId of tokenIds) {
    result.set(tokenId, normalizeHistoryPoints(historyByToken[tokenId]));
  }

  return result;
}

async function fetchTokenHistoriesIndividually(
  tokenIds: string[],
  options: FetchTokenPriceHistoryOptions,
): Promise<Map<string, ClobPriceHistoryPoint[]>> {
  const result = new Map<string, ClobPriceHistoryPoint[]>();

  await Promise.all(
    tokenIds.map(async (tokenId) => {
      try {
        const history = await fetchTokenPriceHistory(tokenId, options);
        result.set(tokenId, history);
      } catch {
        result.set(tokenId, []);
      }
    }),
  );

  return result;
}
