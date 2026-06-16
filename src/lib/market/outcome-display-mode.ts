import type { AppLocale } from "@/i18n/config";

export type OutcomeDisplayMode = "price" | "decimal";

export const OUTCOME_DISPLAY_MODES: OutcomeDisplayMode[] = ["price", "decimal"];

export function resolveOutcomeDisplayMode(
  locale: AppLocale,
  stored?: OutcomeDisplayMode
): OutcomeDisplayMode {
  if (stored) {
    return stored;
  }

  return locale === "zh-TW" ? "decimal" : "price";
}
