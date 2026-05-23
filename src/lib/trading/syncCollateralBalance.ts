import { fetchJson } from "../team/clientFetch";

export async function postCollateralBalanceSync(tokenId?: string): Promise<{ syncedAt: string }> {
  return fetchJson<{ syncedAt: string }>("/api/trading/balance-sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tokenId ? { tokenId } : {}),
  });
}
