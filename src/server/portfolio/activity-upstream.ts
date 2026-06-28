import "server-only";

import {
  isPolymarketActivityRow,
  type PolymarketActivityRow,
} from "@/lib/portfolio/fetch-polymarket-activity";
import { serverFetch } from "@/server/trading/server-fetch";
import { proxyPolymarketGet } from "@/service/prophet";

const ACTIVITY_API_BASE = "https://data-api.polymarket.com/activity";

function buildActivityUpstreamUrl(
  userAddress: string,
  options: { limit: number; offset: number },
): string {
  const params = new URLSearchParams({
    user: userAddress.toLowerCase(),
    limit: String(Math.max(1, Math.min(options.limit, 500))),
    offset: String(Math.max(0, options.offset)),
    excludeDepositsWithdrawals: "false",
    sortBy: "TIMESTAMP",
    sortDirection: "DESC",
  });

  return `${ACTIVITY_API_BASE}?${params.toString()}`;
}

async function readResponseError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim().slice(0, 200) || response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function fetchUserActivityFromUpstream(
  userAddress: string,
  options: { limit: number; offset: number },
): Promise<PolymarketActivityRow[]> {
  const url = buildActivityUpstreamUrl(userAddress, options);

  let payload: unknown;

  try {
    payload = await proxyPolymarketGet<unknown>(url);
  } catch {
    const response = await serverFetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(
        `Activity request failed: ${response.status} ${await readResponseError(response)}`,
      );
    }

    payload = await response.json();
  }

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.filter(isPolymarketActivityRow);
}
