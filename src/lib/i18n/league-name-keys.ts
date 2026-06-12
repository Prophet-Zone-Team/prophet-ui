function normalizeLeagueText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const EXACT_LEAGUE_KEYS: Record<string, string> = {
  match: "match",
  "world cup": "worldCup",
  "fifa world cup": "fifaWorldCup",
  friendlies: "friendlies",
  friendly: "friendlies",
  "international friendly": "friendlies",
  "uefa nations league": "uefaNationsLeague",
  "uefa champions league": "uefaChampionsLeague",
  "uefa europa league": "uefaEuropaLeague",
  "uefa european championship": "euroChampionship",
  "european championship": "euroChampionship",
  "euro championship": "euroChampionship",
  "copa america": "copaAmerica",
  "concacaf gold cup": "concacafGoldCup",
  "africa cup of nations": "africaCupOfNations",
  "afc asian cup": "afcAsianCup",
  "premier league": "premierLeague",
  "la liga": "laLiga",
  bundesliga: "bundesliga",
  "serie a": "serieA",
  "ligue 1": "ligue1"
};

export function resolveLeagueMessageKey(name: string): string | undefined {
  const normalized = normalizeLeagueText(name);

  if (!normalized) {
    return undefined;
  }

  const exactKey = EXACT_LEAGUE_KEYS[normalized];

  if (exactKey) {
    return exactKey;
  }

  if (normalized.includes("world cup") && normalized.includes("qualification")) {
    return "worldCupQualification";
  }

  if (normalized.includes("world cup")) {
    return "worldCup";
  }

  if (normalized.includes("friendly") || normalized.includes("friendlies")) {
    return "friendlies";
  }

  if (normalized.includes("nations league")) {
    return "uefaNationsLeague";
  }

  if (normalized.includes("champions league")) {
    return "uefaChampionsLeague";
  }

  if (normalized.includes("europa league")) {
    return "uefaEuropaLeague";
  }

  if (
    normalized.includes("european championship") ||
    normalized === "euro"
  ) {
    return "euroChampionship";
  }

  if (normalized.includes("copa america")) {
    return "copaAmerica";
  }

  if (normalized.includes("gold cup")) {
    return "concacafGoldCup";
  }

  if (normalized.includes("africa cup")) {
    return "africaCupOfNations";
  }

  if (normalized.includes("asian cup")) {
    return "afcAsianCup";
  }

  if (normalized.includes("premier league")) {
    return "premierLeague";
  }

  if (normalized.includes("la liga")) {
    return "laLiga";
  }

  if (normalized.includes("bundesliga")) {
    return "bundesliga";
  }

  if (normalized.includes("serie a")) {
    return "serieA";
  }

  if (normalized.includes("ligue 1")) {
    return "ligue1";
  }

  return undefined;
}
