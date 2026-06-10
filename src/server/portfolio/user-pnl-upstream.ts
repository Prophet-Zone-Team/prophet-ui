import "server-only";

import {
  mapPortfolioRangeToPnlParams,
  type UserPnlApiPoint
} from "@/lib/portfolio/fetch-user-pnl";
import type { PortfolioTimeRange } from "@/lib/portfolio/types";
import { serverFetch } from "@/server/trading/server-fetch";

const USER_PNL_API_BASE = "https://user-pnl-api.polymarket.com/user-pnl";

async function readResponseError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim().slice(0, 200) || response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function fetchUserPnlFromUpstream(
  userAddress: string,
  range: PortfolioTimeRange
): Promise<UserPnlApiPoint[]> {
  const { interval, fidelity } = mapPortfolioRangeToPnlParams(range);
  const params = new URLSearchParams({
    user_address: userAddress.toLowerCase(),
    interval,
    fidelity
  });
  const url = `${USER_PNL_API_BASE}?${params.toString()}`;

  const response = await serverFetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `User PnL request failed: ${response.status} ${await readResponseError(response)}`
    );
  }

  const payload = (await response.json()) as UserPnlApiPoint[];

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload;
}
