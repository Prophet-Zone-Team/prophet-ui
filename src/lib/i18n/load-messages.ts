import type { AppLocale } from "@/i18n/config";

import { mergeLegalMessages } from "@/lib/i18n/load-legal-messages";

const messageCache = new Map<AppLocale, Record<string, unknown>>();

export function invalidateMessageCache(locale?: AppLocale): void {
  if (locale) {
    messageCache.delete(locale);
    return;
  }

  messageCache.clear();
}

export async function loadMessages(locale: AppLocale): Promise<Record<string, unknown>> {
  const cached = messageCache.get(locale);

  if (cached) {
    return cached;
  }

  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
  const merged = await mergeLegalMessages(locale, messages);
  messageCache.set(locale, merged);
  return merged;
}
