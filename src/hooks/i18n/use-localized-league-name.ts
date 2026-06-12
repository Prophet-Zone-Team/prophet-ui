"use client";

import { useTranslations } from "next-intl";

import { resolveLocalizedLeagueName } from "@/lib/i18n/localized-league-name";

export function useLocalizedLeagueName(name: string): string {
  const t = useTranslations("leagueNames");

  return resolveLocalizedLeagueName(name, t);
}
