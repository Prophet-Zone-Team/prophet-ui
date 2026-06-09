import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { FreshnessMeta, WorldCupMatch } from "@/types/market";



const MOCK_MATCH_ID_PREFIX = "mock-";

interface MatchesFilePayload {
  exportedAt?: string;
  meta?: FreshnessMeta;
  matches?: WorldCupMatch[];
}

let cachedMockMatches: WorldCupMatch[] | undefined;

export async function getMockScheduleMatchesFromFile(): Promise<
  WorldCupMatch[]
> {
  if (cachedMockMatches) {
    return cachedMockMatches;
  }

  const filePath = join(process.cwd(), "data/matches.json");
  const raw = await readFile(filePath, "utf-8");
  const payload = JSON.parse(raw) as MatchesFilePayload;
  const matches = (payload.matches ?? []).filter((match) =>
    match.id.startsWith(MOCK_MATCH_ID_PREFIX)
  );

  cachedMockMatches = matches;
  return matches;
}

export function clearMockScheduleMatchesCache(): void {
  cachedMockMatches = undefined;
}

export async function getMockScheduleMatchesMeta(): Promise<FreshnessMeta> {
  const filePath = join(process.cwd(), "data/matches.json");
  const raw = await readFile(filePath, "utf-8");
  const payload = JSON.parse(raw) as MatchesFilePayload;

  return {
    source: "mock-schedule-matches",
    status: "cached",
    lastUpdated: payload.exportedAt ?? new Date().toISOString()
  };
}
