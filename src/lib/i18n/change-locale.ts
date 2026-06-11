"use client";

import type { AppLocale } from "@/i18n/config";
import { invalidateMessageCache, loadMessages } from "@/lib/i18n/load-messages";
import { setLocaleCookie } from "@/lib/i18n/set-locale-cookie";
import { setRuntimeMessages } from "@/lib/i18n/runtime-messages";

export async function applyLocaleChange(
  locale: AppLocale,
  options?: { refresh?: () => void }
): Promise<Record<string, unknown>> {
  setLocaleCookie(locale);
  invalidateMessageCache(locale);
  const messages = await loadMessages(locale);
  setRuntimeMessages(locale, messages);
  options?.refresh?.();
  return messages;
}
