import { getCloudflareD1Database } from "../cloudflare/d1";
import { createD1MarketHistoryRepository } from "./d1MarketHistoryRepository";
import type { MarketHistoryRepository } from "./types";

export async function getMarketHistoryRepository(): Promise<MarketHistoryRepository> {
  const database = await getCloudflareD1Database();

  if (database) {
    return createD1MarketHistoryRepository(database);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing Cloudflare D1 binding MARKET_HISTORY_DB for market history storage.");
  }

  const { fileMarketHistoryRepository } = await import("./fileMarketHistoryRepository");
  return fileMarketHistoryRepository;
}
