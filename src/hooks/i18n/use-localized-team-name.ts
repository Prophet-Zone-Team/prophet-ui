"use client";

import { useTranslations } from "next-intl";

import { resolveLocalizedTeamName } from "@/lib/i18n/localized-team-name";

export function useLocalizedTeamName(
  code: string | undefined,
  fallbackName?: string
): string {
  const t = useTranslations("teamNames");

  return resolveLocalizedTeamName(code, fallbackName, t);
}
