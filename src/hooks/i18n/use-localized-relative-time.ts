"use client";

import { useLocale, useTranslations } from "next-intl";

import { formatLocalizedRelativeTime } from "@/lib/i18n/format-localized-relative-time";

export function useLocalizedRelativeTime(iso: string | undefined): string {
  const locale = useLocale();
  const t = useTranslations("common");

  return formatLocalizedRelativeTime(iso, t, locale);
}
