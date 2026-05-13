import type { Team } from "../types/market";

const teamAliases: Record<string, string[]> = {
  argentina: ["argentina", "argentine republic", "arg"],
  australia: ["australia", "socceroos", "aus"],
  belgium: ["belgium", "bel"],
  brazil: ["brazil", "brasil", "bra"],
  canada: ["canada", "can"],
  colombia: ["colombia", "col"],
  croatia: ["croatia", "cro"],
  denmark: ["denmark", "den"],
  england: ["england", "eng"],
  france: ["france", "fra"],
  germany: ["germany", "ger"],
  ghana: ["ghana", "gha"],
  italy: ["italy", "italia", "ita"],
  japan: ["japan", "jpn"],
  mexico: ["mexico", "mex"],
  morocco: ["morocco", "mar"],
  netherlands: ["netherlands", "the netherlands", "holland", "ned"],
  portugal: ["portugal", "por"],
  senegal: ["senegal", "sen"],
  "south-korea": ["south korea", "korea republic", "republic of korea", "korea", "kor"],
  spain: ["spain", "espana", "esp"],
  switzerland: ["switzerland", "sui"],
  uruguay: ["uruguay", "uru"],
  usa: ["united states", "usa", "us", "united states of america", "u.s.", "u.s.a."],
};

export function getTeamNameAliases(team: Team): string[] {
  return dedupeAliases([team.name, team.code, team.id, ...(teamAliases[team.id] ?? [])]);
}

export function normalizeTeamAlias(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupeAliases(values: string[]): string[] {
  const seen = new Set<string>();
  const aliases: string[] = [];

  for (const value of values) {
    const alias = normalizeTeamAlias(value);

    if (!alias || seen.has(alias)) {
      continue;
    }

    seen.add(alias);
    aliases.push(alias);
  }

  return aliases;
}
