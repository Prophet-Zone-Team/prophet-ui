import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { FreshnessMeta, WorldCupMatch } from "@/types/market";

interface MatchesFallbackFile {
  exportedAt?: string;
  meta?: FreshnessMeta;
  matches?: WorldCupMatch[];
}

interface FootballMatchesFallbackResult {
  matches: WorldCupMatch[];
  meta: FreshnessMeta;
}

let cachedFallback: FootballMatchesFallbackResult | undefined;

export function isFootballMatchesFileFallbackEnabled(): boolean {
  const value =
    process.env.FOOTBALL_MATCHES_FILE_FALLBACK?.trim().toLowerCase();

  if (value === "0" || value === "false" || value === "no" || value === "off") {
    return false;
  }

  return true;
}

export function clearFootballMatchesFileFallbackCache(): void {
  cachedFallback = undefined;
}
