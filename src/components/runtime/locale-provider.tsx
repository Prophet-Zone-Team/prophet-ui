"use client";

import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";

import type { AppLocale } from "@/i18n/config";
import { loadMessages } from "@/lib/i18n/load-messages";
import { setRuntimeMessages } from "@/lib/i18n/runtime-messages";
import { setLocaleCookie } from "@/lib/i18n/set-locale-cookie";
import { useConfigHydrated } from "@/store/use-config-hydrated";
import { useLocale } from "@/store/user-config-store";

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale: AppLocale;
  initialMessages: Record<string, unknown>;
}

export function LocaleProvider({
  children,
  initialLocale,
  initialMessages
}: LocaleProviderProps) {
  const hydrated = useConfigHydrated();
  const storeLocale = useLocale();
  const [locale, setLocale] = useState(initialLocale);
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    if (!hydrated) {
      setRuntimeMessages(initialLocale, initialMessages);
      return;
    }

    if (storeLocale === locale && messages === initialMessages && storeLocale === initialLocale) {
      setRuntimeMessages(storeLocale, messages);
      setLocaleCookie(storeLocale);
      return;
    }

    let cancelled = false;

    void loadMessages(storeLocale).then((loaded) => {
      if (cancelled) {
        return;
      }

      setLocale(storeLocale);
      setMessages(loaded);
      setRuntimeMessages(storeLocale, loaded);
      setLocaleCookie(storeLocale);
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated, storeLocale, initialLocale, initialMessages, locale, messages]);

  const activeLocale = hydrated ? locale : initialLocale;
  const activeMessages = hydrated ? messages : initialMessages;

  return (
    <NextIntlClientProvider
      locale={activeLocale}
      messages={activeMessages}
      timeZone="UTC"
    >
      {children}
    </NextIntlClientProvider>
  );
}
