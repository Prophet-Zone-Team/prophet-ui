import { fetchJson } from "@/lib/team/client-fetch";

export async function fetchPolymarket<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL("/api/polymarket", window.location.origin);
  url.searchParams.set("path", path.startsWith("/") ? path : `/${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return fetchJson<T>(url.toString());
}

export interface PolymarketClobBatchPricesHistoryBody {
  markets: string[];
  interval?: string;
  fidelity?: number;
  start_ts?: number;
  end_ts?: number;
}

export interface PolymarketClobBatchPricesHistoryResponse {
  history?: Record<string, Array<{ t: number; p: number }>>;
  error?: string;
}

export async function postPolymarketClob<T>(
  path: string,
  body: Record<string, unknown>,
  init?: RequestInit,
): Promise<T> {
  return fetchJson<T>("/api/polymarket", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
    body: JSON.stringify({
      target: "clob",
      path: path.startsWith("/") ? path : `/${path}`,
      body,
    }),
    signal: init?.signal,
  });
}
