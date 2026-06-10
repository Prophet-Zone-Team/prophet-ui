import { getProphetTokenPrices } from "@/service/prophet";
import type { TokenPricesBySymbol } from "@/types/funding";

export async function fetchTokenPrices(signal?: AbortSignal): Promise<TokenPricesBySymbol> {
  return getProphetTokenPrices(signal);
}
