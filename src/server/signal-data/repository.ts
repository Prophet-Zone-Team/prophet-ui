import { getCloudflareD1Database } from "@/server/cloudflare/d1";
import { createD1SignalDataRepository } from "@/server/signal-data/d1-signal-data-repository";
import type { SignalDataRepository } from "@/server/signal-data/types";

export async function getSignalDataRepository(): Promise<SignalDataRepository> {
  const database = await getCloudflareD1Database();

  if (database) {
    return createD1SignalDataRepository(database);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing Cloudflare D1 binding MARKET_HISTORY_DB for signal data storage.");
  }

  const { fileSignalDataRepository } = await import("./file-signal-data-repository");
  return fileSignalDataRepository;
}
