import { GAMMA_API_BASE } from "@/lib/market/polymarket-gamma";
import { serverFetch } from "@/server/trading/server-fetch";

export class PolymarketGammaNotFoundError extends Error {
  readonly status = 404;

  constructor(path: string) {
    super(`Polymarket Gamma API returned HTTP 404 for ${path}.`);
    this.name = "PolymarketGammaNotFoundError";
  }
}

export class PolymarketGammaFetchError extends Error {
  readonly status: number;

  constructor(path: string, status: number) {
    super(`Polymarket Gamma API returned HTTP ${status} for ${path}.`);
    this.name = "PolymarketGammaFetchError";
    this.status = status;
  }
}

export async function fetchPolymarketGamma<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  if (!path.startsWith("/")) {
    throw new Error("Polymarket Gamma path must start with /.");
  }

  const gammaUrl = new URL(`${GAMMA_API_BASE}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      gammaUrl.searchParams.set(key, value);
    }
  }

  const response = await serverFetch(gammaUrl, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  if (response.status === 404) {
    throw new PolymarketGammaNotFoundError(path);
  }

  if (!response.ok) {
    throw new PolymarketGammaFetchError(path, response.status);
  }

  return (await response.json()) as T;
}
