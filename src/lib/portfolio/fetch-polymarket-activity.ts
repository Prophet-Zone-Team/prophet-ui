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

export function isPolymarketActivityRow(
  value: unknown
): value is PolymarketActivityRow {
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
  options: { limit: number; offset: number },
  useProxy: boolean
): string {
  const limit = Math.max(1, Math.min(options.limit, 500));
  const offset = Math.max(0, options.offset);

  if (useProxy) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset)
    });

    return `/api/portfolio/activity?${params.toString()}`;
  }

  const params = new URLSearchParams({
    user: userAddress.toLowerCase(),
    limit: String(limit),
    offset: String(offset),
    excludeDepositsWithdrawals: "false",
    sortBy: "TIMESTAMP",
    sortDirection: "DESC"
  });

  return `${ACTIVITY_API_BASE}?${params.toString()}`;
}

interface ActivityProxyResponse {
  activities?: PolymarketActivityRow[];
  hasMore?: boolean;
  error?: string;
}

export async function fetchPolymarketUserActivity(
  userAddress: string,
  options: { limit: number; offset: number },
  proxyOptions?: { useProxy?: boolean }
): Promise<{ activities: PolymarketActivityRow[]; hasMore: boolean }> {
  const trimmedAddress = userAddress.trim();
  const useProxy = proxyOptions?.useProxy ?? true;

  if (!trimmedAddress && !useProxy) {
    return { activities: [], hasMore: false };
  }

  const limit = Math.max(1, Math.min(options.limit, 500));
  const url = buildActivityUrl(
    trimmedAddress,
    {
      limit,
      offset: options.offset
    },
    useProxy
  );

  if (useProxy) {
    const payload = await fetchJson<ActivityProxyResponse>(url);

    return {
      activities: Array.isArray(payload.activities)
        ? payload.activities.filter(isPolymarketActivityRow)
        : [],
      hasMore: payload.hasMore === true
    };
  }

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
