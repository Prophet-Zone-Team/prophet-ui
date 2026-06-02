import { fetchJson } from "@/lib/team/client-fetch";
import type {
  PortfolioSeriesPoint,
  PortfolioTimeRange
} from "@/lib/portfolio/types";

const USER_PNL_API_BASE = "https://user-pnl-api.polymarket.com/user-pnl";

export interface UserPnlApiPoint {
  t: number;
  p: number;
}

export interface UserPnlQueryParams {
  interval: string;
  fidelity: string;
}

export function mapPortfolioRangeToPnlParams(
  range: PortfolioTimeRange
): UserPnlQueryParams {
  const fidelity = range === "All" ? "1d" : "3h";
  const intervalByRange: Record<PortfolioTimeRange, string> = {
    "1H": "1h",
    "1D": "1d",
    "1W": "1w",
    "1M": "1m",
    All: "all"
  };

  return {
    interval: intervalByRange[range],
    fidelity
  };
}

function formatSeriesDate(
  timestampSeconds: number,
  range: PortfolioTimeRange
): string {
  const date = new Date(timestampSeconds * 1000);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  if (range === "1H" || range === "1D") {
    return new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function mapUserPnlToSeries(
  points: UserPnlApiPoint[],
  range: PortfolioTimeRange
): PortfolioSeriesPoint[] {
  if (!Array.isArray(points)) {
    return [];
  }

  return points.map((point) => ({
    date: formatSeriesDate(point.t, range),
    value: Number.isFinite(point.p) ? point.p : 0,
    timestamp: point.t
  }));
}

function buildUserPnlUrl(
  userAddress: string,
  range: PortfolioTimeRange,
  useProxy: boolean
): string {
  if (useProxy) {
    return `/api/portfolio/user-pnl?range=${encodeURIComponent(range)}`;
  }

  const { interval, fidelity } = mapPortfolioRangeToPnlParams(range);
  const params = new URLSearchParams({
    user_address: userAddress.toLowerCase(),
    interval,
    fidelity
  });

  return `${USER_PNL_API_BASE}?${params.toString()}`;
}

function isMappedPortfolioSeries(
  payload: unknown[]
): payload is PortfolioSeriesPoint[] {
  if (payload.length === 0) {
    return true;
  }

  const first = payload[0];

  return (
    typeof first === "object" &&
    first !== null &&
    "value" in first &&
    typeof (first as PortfolioSeriesPoint).value === "number" &&
    !("p" in first)
  );
}

export async function fetchUserPnlSeries(
  userAddress: string | undefined,
  range: PortfolioTimeRange,
  options?: { useProxy?: boolean }
): Promise<PortfolioSeriesPoint[]> {
  if (!userAddress?.trim()) {
    return [];
  }

  const useProxy = options?.useProxy ?? true;
  const url = buildUserPnlUrl(userAddress.trim(), range, useProxy);
  const payload = await fetchJson<
    UserPnlApiPoint[] | PortfolioSeriesPoint[] | { error?: string }
  >(url);

  if (!Array.isArray(payload)) {
    return [];
  }

  if (useProxy && isMappedPortfolioSeries(payload)) {
    return payload;
  }

  return mapUserPnlToSeries(payload as UserPnlApiPoint[], range);
}
