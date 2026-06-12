export const SORT_METHOD_KEYS = {
  defaultOrder: "methodDefaultOrder",
  randomFill: "methodRandomFill",
  fifaRank: "methodFifaRank",
  squadValueRanking: "methodSquadValueRanking"
} as const;

export const KNOCKOUT_METHOD_KEYS = {
  manualSelection: "methodManualSelection",
  randomFill: "methodRandomFill",
  fifaRank: "methodFifaRank",
  squadValueRanking: "methodSquadValueRanking"
} as const;

export type SortMethodKey = keyof typeof SORT_METHOD_KEYS;
export type KnockoutMethodKey = keyof typeof KNOCKOUT_METHOD_KEYS;

const LEGACY_SORT_METHODS: Record<string, SortMethodKey> = {
  "Default order": "defaultOrder",
  "Random fill": "randomFill",
  "FIFA rank 2026-04-01": "fifaRank",
  "Squad value ranking": "squadValueRanking"
};

const LEGACY_KNOCKOUT_METHODS: Record<string, KnockoutMethodKey> = {
  "Manual selection": "manualSelection",
  "Random fill": "randomFill",
  "FIFA rank 2026-04-01": "fifaRank",
  "Squad value ranking": "squadValueRanking"
};

export function normalizeSortMethod(value: string): SortMethodKey {
  if (value in SORT_METHOD_KEYS) {
    return value as SortMethodKey;
  }

  return LEGACY_SORT_METHODS[value] ?? "defaultOrder";
}

export function normalizeKnockoutMethod(value: string): KnockoutMethodKey {
  if (value in KNOCKOUT_METHOD_KEYS) {
    return value as KnockoutMethodKey;
  }

  return LEGACY_KNOCKOUT_METHODS[value] ?? "manualSelection";
}

export function translateSortMethod(
  value: string,
  t: (key: string) => string
): string {
  return t(SORT_METHOD_KEYS[normalizeSortMethod(value)]);
}

export function translateKnockoutMethod(
  value: string,
  t: (key: string) => string
): string {
  return t(KNOCKOUT_METHOD_KEYS[normalizeKnockoutMethod(value)]);
}
