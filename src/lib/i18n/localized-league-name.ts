import { resolveLeagueMessageKey } from "@/lib/i18n/league-name-keys";
import { getRuntimeTranslator } from "@/lib/i18n/runtime-messages";

interface LeagueNameTranslator {
  (key: string): string;
  has(key: string): boolean;
}

export function resolveLocalizedLeagueName(
  name: string,
  translator: LeagueNameTranslator
): string {
  const key = resolveLeagueMessageKey(name);

  if (key && translator.has(key)) {
    return translator(key);
  }

  return name.trim();
}

export function getLocalizedLeagueName(name: string): string {
  return resolveLocalizedLeagueName(
    name,
    getRuntimeTranslator("leagueNames") as LeagueNameTranslator
  );
}
