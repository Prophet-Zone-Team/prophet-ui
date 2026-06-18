import "server-only";

import { serverFetch } from "@/server/trading/server-fetch";
import type { ComboMarketRecord, ComboMarketsResponse } from "@/types/combo";

const DEFAULT_COMBO_RFQ_API_URL = "https://combos-rfq-api.polymarket.com";

export function getComboRfqApiUrl() {
  return process.env.POLYMARKET_COMBO_RFQ_HOST?.trim() || DEFAULT_COMBO_RFQ_API_URL;
}

export async function fetchComboMarketsFromRfqApi({
  limit = 50,
  cursor,
  exclude,
}: {
  limit?: number;
  cursor?: string;
  exclude?: string[];
}): Promise<ComboMarketsResponse> {
  const params = new URLSearchParams({
    limit: String(Math.max(1, Math.min(limit, 100))),
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  if (exclude?.length) {
    params.set("exclude", exclude.join(","));
  }

  const response = await serverFetch(
    `${getComboRfqApiUrl()}/v1/rfq/combo-markets?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to fetch combo markets: ${await readResponseError(response)}`,
    );
  }

  const payload = (await response.json()) as {
    markets?: unknown[];
    next_cursor?: string | null;
    nextCursor?: string | null;
  };

  return {
    markets: Array.isArray(payload.markets)
      ? payload.markets
          .map(normalizeComboMarketRecord)
          .filter((market): market is ComboMarketRecord => Boolean(market))
      : [],
    nextCursor: payload.next_cursor ?? payload.nextCursor ?? null,
  };
}

function normalizeComboMarketRecord(value: unknown): ComboMarketRecord | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const positionIds = raw.position_ids ?? raw.positionIds;
  const conditionId = raw.condition_id ?? raw.conditionId;
  const outcomePrices = raw.outcome_prices ?? raw.outcomePrices;

  if (
    typeof raw.id !== "string" ||
    typeof conditionId !== "string" ||
    !Array.isArray(positionIds) ||
    positionIds.length < 2
  ) {
    return undefined;
  }

  const outcomes = Array.isArray(raw.outcomes)
    ? (raw.outcomes as string[])
    : ["Yes", "No"];
  const prices = Array.isArray(outcomePrices)
    ? (outcomePrices as string[])
    : ["0", "0"];

  return {
    id: raw.id,
    conditionId,
    positionIds: [String(positionIds[0]), String(positionIds[1])],
    slug: typeof raw.slug === "string" ? raw.slug : "",
    title: typeof raw.title === "string" ? raw.title : "",
    outcomes: [outcomes[0] ?? "Yes", outcomes[1] ?? "No"],
    outcomePrices: [prices[0] ?? "0", prices[1] ?? "0"],
    image: typeof raw.image === "string" ? raw.image : undefined,
    volume: typeof raw.volume === "number" ? raw.volume : undefined,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : undefined,
  };
}

async function readResponseError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };

    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Fall through to status text.
  }

  return response.statusText || `HTTP ${response.status}`;
}
