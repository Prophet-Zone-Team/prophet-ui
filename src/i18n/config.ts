export const locales = ["en", "es", "ko", "ja", "zh-TW", "ru"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export function resolveLocale(value: string | undefined | null): AppLocale {
  return isAppLocale(value) ? value : defaultLocale;
}
