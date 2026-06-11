import type { AppLocale } from "@/i18n/config";

const messageCache = new Map<AppLocale, Record<string, unknown>>();

export async function loadMessages(locale: AppLocale): Promise<Record<string, unknown>> {
  const cached = messageCache.get(locale);

  if (cached) {
    return cached;
  }

  const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
  messageCache.set(locale, messages);
  return messages;
}
