import type { AppLocale } from "@/i18n/config";

import privacyEn from "@/i18n/legal/privacy.en.json";
import termsEn from "@/i18n/legal/terms.en.json";

export type LegalDocMessages = Record<string, unknown>;

export type LegalDocBundle = {
  privacy: LegalDocMessages;
  terms: LegalDocMessages;
};

const legalMessageLoaders: Partial<Record<AppLocale, () => Promise<LegalDocBundle>>> = {
  en: async () => ({ privacy: privacyEn, terms: termsEn }),
  es: async () => ({
    privacy: (await import("@/i18n/legal/privacy.es.json")).default,
    terms: (await import("@/i18n/legal/terms.es.json")).default,
  }),
  pt: async () => ({
    privacy: (await import("@/i18n/legal/privacy.pt.json")).default,
    terms: (await import("@/i18n/legal/terms.pt.json")).default,
  }),
  ko: async () => ({
    privacy: (await import("@/i18n/legal/privacy.ko.json")).default,
    terms: (await import("@/i18n/legal/terms.ko.json")).default,
  }),
  ja: async () => ({
    privacy: (await import("@/i18n/legal/privacy.ja.json")).default,
    terms: (await import("@/i18n/legal/terms.ja.json")).default,
  }),
  "zh-TW": async () => ({
    privacy: (await import("@/i18n/legal/privacy.zh-TW.json")).default,
    terms: (await import("@/i18n/legal/terms.zh-TW.json")).default,
  }),
  ru: async () => ({
    privacy: (await import("@/i18n/legal/privacy.ru.json")).default,
    terms: (await import("@/i18n/legal/terms.ru.json")).default,
  }),
};

export async function loadLegalDocMessages(locale: AppLocale): Promise<LegalDocBundle> {
  const loader = legalMessageLoaders[locale] ?? legalMessageLoaders.en;

  return loader?.() ?? { privacy: privacyEn, terms: termsEn };
}

export async function mergeLegalMessages(
  locale: AppLocale,
  messages: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const legalDocs = await loadLegalDocMessages(locale);
  const legal = (messages.legal ?? {}) as Record<string, unknown>;

  return {
    ...messages,
    legal: {
      ...legal,
      docs: legalDocs,
    },
  };
}
