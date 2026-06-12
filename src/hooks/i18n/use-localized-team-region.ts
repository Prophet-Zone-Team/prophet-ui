"use client";

import { useTranslations } from "next-intl";

import { getTeamRegionMessageKey } from "@/lib/i18n/team-region";
import type { TeamRegion } from "@/types/market";

export function useLocalizedTeamRegion(region: TeamRegion): string {
  const t = useTranslations("teamRegions");
  const key = getTeamRegionMessageKey(region);

  return t(key);
}
