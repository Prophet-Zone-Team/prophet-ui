import { fetchJson } from "@/lib/team/client-fetch";
import type { ClobHealthResponse } from "@/types/market";

export async function ensureClobApiReachable() {
  const health = await fetchJson<ClobHealthResponse>("/api/trading/clob-health");

  if (!health.reachable) {
    throw new Error(
      health.error ??
        `Polymarket CLOB API is unreachable at ${health.host}. Check server network access or POLYMARKET_CLOB_HOST.`,
    );
  }

  return health;
}
