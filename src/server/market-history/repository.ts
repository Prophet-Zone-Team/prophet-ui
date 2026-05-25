import { getCloudflareD1Database } from "@/server/cloudflare/d1";
import { createD1MarketHistoryRepository } from "@/server/market-history/d1-market-history-repository";
import type { MarketHistoryRepository } from "@/server/market-history/types";

export async function getMarketHistoryRepository(): Promise<MarketHistoryRepository> {
  const database = await getCloudflareD1Database();

  if (database) {
    return createD1MarketHistoryRepository(database);
  }

  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("Missing Cloudflare D1 binding MARKET_HISTORY_DB for market history storage.");
  }

  const { fileMarketHistoryRepository } = await import("./file-market-history-repository");
  return fileMarketHistoryRepository;
}
