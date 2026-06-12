import { getRuntimeTranslator } from "@/lib/i18n/runtime-messages";

interface TeamNameTranslator {
  (key: string): string;
  has(key: string): boolean;
}

// FIFA World Cup 2026 codes (groups.ts) -> teamNames keys (teams/index.ts abbreviations).
const TEAM_CODE_ALIASES: Record<string, string> = {
  COD: "CDR",
  CPV: "CVI",
  CRO: "HRV",
  CUW: "CW",
  NED: "NLD",
  POR: "PRT",
  SUI: "CHE",
  URU: "URY"
};

export function normalizeTeamCode(code?: string | null): string | undefined {
  const trimmed = code?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.toUpperCase();
}

export function resolveLocalizedTeamName(
  code: string | undefined,
  fallbackName: string | undefined,
  translator: TeamNameTranslator
): string {
  const normalized = normalizeTeamCode(code);
  const lookupKey = normalized
    ? (TEAM_CODE_ALIASES[normalized] ?? normalized)
    : undefined;

  if (lookupKey && translator.has(lookupKey)) {
    return translator(lookupKey);
  }

  return fallbackName?.trim() || normalized || "";
}

export function getLocalizedTeamName(
  code: string | undefined,
  fallbackName?: string
): string {
  return resolveLocalizedTeamName(
    code,
    fallbackName,
    getRuntimeTranslator("teamNames") as TeamNameTranslator
  );
}
