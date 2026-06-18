import { fetchJson } from "@/lib/team/client-fetch";

import type {
  ComboPositionRecord,
  ComboPositionStatus,
  ComboPositionsResponse
} from "@/lib/portfolio/combo-positions/types";

const COMBO_POSITIONS_API_BASE =
  "https://data-api.polymarket.com/v1/positions/combos";

export type FetchPolymarketComboPositionsOptions = {
  limit?: number;
  offset?: number;
  status?: ComboPositionStatus;
  sort?:
    | "current_value_desc"
    | "first_entry_desc"
    | "entry_cost_desc"
    | "resolved_at_desc";
  marketIds?: string[];
};

function isComboPositionRecord(value: unknown): value is ComboPositionRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<ComboPositionRecord>;
  return Array.isArray(record.legs);
}

function buildComboPositionsUrl(
  userAddress: string,
  options: FetchPolymarketComboPositionsOptions
): string {
  const limit = Math.max(0, Math.min(options.limit ?? 20, 100));
  const offset = Math.max(0, Math.min(options.offset ?? 0, 10000));

  const params = new URLSearchParams({
    user: userAddress.toLowerCase(),
    limit: String(limit),
    offset: String(offset),
    sort: options.sort ?? "current_value_desc"
  });

  if (options.status) {
    params.set("status", options.status);
  }

  if (options.marketIds?.length) {
    params.set("market_id", options.marketIds.join(","));
  }

  return `${COMBO_POSITIONS_API_BASE}?${params.toString()}`;
}

export async function fetchPolymarketComboPositions(
  userAddress: string,
  options: FetchPolymarketComboPositionsOptions = {}
): Promise<ComboPositionRecord[]> {
  const trimmedAddress = userAddress.trim();

  if (!trimmedAddress) {
    return [];
  }

  const url = buildComboPositionsUrl(trimmedAddress, options);
  const payload = await fetchJson<ComboPositionsResponse>(url);

  if (!Array.isArray(payload?.combos)) {
    return [];
  }

  return payload.combos.filter(isComboPositionRecord);
}
