export const DEFAULT_TOKEN_PRICE_API_URL =
  "https://api.dapdap.net/get-token-price-by-dapdap";

export function getTokenPriceApiUrl(): string {
  return process.env.NEXT_PUBLIC_TOKEN_PRICE_API_URL?.trim() ?? DEFAULT_TOKEN_PRICE_API_URL;
}
