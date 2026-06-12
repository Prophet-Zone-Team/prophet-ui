import { createTranslator } from "next-intl";

import { defaultLocale, type AppLocale } from "@/i18n/config";
import enMessages from "@/i18n/messages/en.json";

export type AppMessages = typeof enMessages;

let currentLocale: AppLocale = defaultLocale;
let currentMessages: AppMessages = enMessages;

export function setRuntimeMessages(locale: AppLocale, messages: Record<string, unknown>): void {
  currentLocale = locale;
  currentMessages = messages as AppMessages;
}

export function getRuntimeLocale(): AppLocale {
  return currentLocale;
}

export function getRuntimeTranslator<Namespace extends keyof AppMessages>(namespace: Namespace) {
  return createTranslator({
    locale: currentLocale,
    messages: currentMessages,
    namespace
  });
}
