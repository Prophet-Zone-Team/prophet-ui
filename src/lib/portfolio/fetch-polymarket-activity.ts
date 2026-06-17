import { fetchJson } from "@/lib/team/client-fetch";

const ACTIVITY_API_BASE = "https://data-api.polymarket.com/activity";

export interface PolymarketActivityRow {
  proxyWallet?: string;
  timestamp: number;
  conditionId?: string;
  type: string;
  size: number;
  usdcSize: number;
  transactionHash: string;
  price: number;
  asset?: string;
  side?: string;
  outcomeIndex?: number;
  title?: string;
  slug?: string;
  icon?: string;
  eventSlug?: string;
  outcome?: string;
}

function isPolymarketActivityRow(value: unknown): value is PolymarketActivityRow {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<PolymarketActivityRow>;

  return (
    typeof record.type === "string" &&
    typeof record.timestamp === "number" &&
    Number.isFinite(record.timestamp) &&
    typeof record.transactionHash === "string" &&
    typeof record.size === "number" &&
    Number.isFinite(record.size) &&
    typeof record.usdcSize === "number" &&
    Number.isFinite(record.usdcSize) &&
    typeof record.price === "number" &&
    Number.isFinite(record.price)
  );
}

function buildActivityUrl(
  userAddress: string,
  options: { limit: number; offset: number }
): string {
  const params = new URLSearchParams({
    user: userAddress.toLowerCase(),
    limit: String(Math.max(1, Math.min(options.limit, 500))),
    offset: String(Math.max(0, options.offset)),
    excludeDepositsWithdrawals: "false",
    sortBy: "TIMESTAMP",
    sortDirection: "DESC"
  });

  return `${ACTIVITY_API_BASE}?${params.toString()}`;
}

export async function fetchPolymarketUserActivity(
  userAddress: string,
  options: { limit: number; offset: number }
): Promise<{ activities: PolymarketActivityRow[]; hasMore: boolean }> {
  // const trimmedAddress = userAddress.trim();
  const trimmedAddress = "0xdd3c16a48bAb4A55784C8d371FBaCf43bBC423C3";

  if (!trimmedAddress) {
    return { activities: [], hasMore: false };
  }

  const limit = Math.max(1, Math.min(options.limit, 500));
  const url = buildActivityUrl(trimmedAddress, {
    limit,
    offset: options.offset
  });
  const payload = await fetchJson<unknown>(url);

  if (!Array.isArray(payload)) {
    return { activities: [], hasMore: false };
  }

  const activities = payload.filter(isPolymarketActivityRow);

  return {
    activities,
    hasMore: activities.length === limit
  };
}
