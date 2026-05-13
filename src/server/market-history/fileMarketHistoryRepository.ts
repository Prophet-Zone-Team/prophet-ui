import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { MarketHistoryReadOptions, MarketHistoryRepository, MarketSnapshotRecord } from "./types";

const HISTORY_FILE_PATH = join(process.cwd(), ".data", "market-history.json");

export const fileMarketHistoryRepository: MarketHistoryRepository = {
  async appendSnapshots(records: MarketSnapshotRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    const existingRecords = await readAllRecords();
    const recordsByKey = new Map<string, MarketSnapshotRecord>();

    for (const record of existingRecords) {
      recordsByKey.set(getDedupeKey(record), record);
    }

    for (const record of records) {
      recordsByKey.set(getDedupeKey(record), record);
    }

    const sortedRecords = [...recordsByKey.values()].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
    await writeAllRecords(sortedRecords);
  },

  async readSnapshots(options: MarketHistoryReadOptions): Promise<MarketSnapshotRecord[]> {
    const cutoff = getCutoffDate(options.days);
    const records = await readAllRecords();

    return records
      .filter((record) => record.source === options.source)
      .filter((record) => !options.teamId || record.teamId === options.teamId)
      .filter((record) => !cutoff || new Date(record.capturedAt) >= cutoff)
      .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  },

  async readSourceStats() {
    const records = await readAllRecords();
    const statsBySource = new Map<string, { count: number; latestCapturedAt?: string }>();

    for (const record of records) {
      const existing = statsBySource.get(record.source) ?? { count: 0 };
      statsBySource.set(record.source, {
        count: existing.count + 1,
        latestCapturedAt:
          !existing.latestCapturedAt || record.capturedAt > existing.latestCapturedAt
            ? record.capturedAt
            : existing.latestCapturedAt,
      });
    }

    return [...statsBySource.entries()]
      .map(([source, stat]) => ({
        source: source as MarketSnapshotRecord["source"],
        count: stat.count,
        latestCapturedAt: stat.latestCapturedAt,
      }))
      .sort((a, b) => a.source.localeCompare(b.source));
  },
};

async function readAllRecords(): Promise<MarketSnapshotRecord[]> {
  try {
    const raw = await readFile(HISTORY_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isMarketSnapshotRecord) : [];
  } catch (error) {
    if (isNotFoundError(error)) {
      return [];
    }

    throw error;
  }
}

async function writeAllRecords(records: MarketSnapshotRecord[]): Promise<void> {
  await mkdir(dirname(HISTORY_FILE_PATH), { recursive: true });
  const tempPath = `${HISTORY_FILE_PATH}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  await rename(tempPath, HISTORY_FILE_PATH);
}

function getCutoffDate(days: number | undefined): Date | undefined {
  if (!days || days <= 0) {
    return undefined;
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff;
}

function getDedupeKey(record: MarketSnapshotRecord): string {
  return `${record.source}:${record.teamId}:${record.capturedAt.slice(0, 16)}`;
}

function isMarketSnapshotRecord(value: unknown): value is MarketSnapshotRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Partial<MarketSnapshotRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.source === "string" &&
    typeof record.teamId === "string" &&
    typeof record.probability === "number" &&
    typeof record.capturedAt === "string"
  );
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
