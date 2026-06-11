"use client";

import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import type { AppLocale } from "@/i18n/config";
import { invalidateMessageCache, loadMessages } from "@/lib/i18n/load-messages";
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
  const activeLocale = hydrated ? storeLocale : initialLocale;
  const [messages, setMessages] = useState(initialMessages);

  const serverMessagesKey = useMemo(
    () => JSON.stringify(initialMessages),
    [initialMessages]
  );

  useEffect(() => {
    if (!hydrated) {
      setMessages(initialMessages);
      setRuntimeMessages(initialLocale, initialMessages);
      return;
    }

    if (activeLocale === initialLocale) {
      setMessages(initialMessages);
      setRuntimeMessages(initialLocale, initialMessages);
      setLocaleCookie(initialLocale);
      return;
    }

    let cancelled = false;

    invalidateMessageCache(activeLocale);
    void loadMessages(activeLocale).then((loaded) => {
      if (cancelled) {
        return;
      }

      setMessages(loaded);
      setRuntimeMessages(activeLocale, loaded);
      setLocaleCookie(activeLocale);
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated, activeLocale, initialLocale, initialMessages, serverMessagesKey]);

  return (
    <NextIntlClientProvider
      locale={activeLocale}
      messages={messages}
      timeZone="UTC"
    >
      {children}
    </NextIntlClientProvider>
  );
}
