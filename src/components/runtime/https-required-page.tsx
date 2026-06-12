"use client";

import { NextIntlClientProvider, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  defaultLocale,
  LOCALE_COOKIE,
  resolveLocale,
  type AppLocale
} from "@/i18n/config";
import enMessages from "@/i18n/messages/en.json";
import { loadMessages } from "@/lib/i18n/load-messages";
import { getHttpsUpgradeUrl } from "@/lib/runtime/is-secure-app-context";

function readLocaleFromCookie(): AppLocale {
  const match = document.cookie.match(
    new RegExp(
      `(?:^|; )${LOCALE_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`
    )
  );

  return resolveLocale(match?.[1] ? decodeURIComponent(match[1]) : null);
}

function HttpsRequiredPageContent() {
  const t = useTranslations("runtime");

  const handleOpenSecure = () => {
    window.location.assign(getHttpsUpgradeUrl());
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFC] px-5 py-12">
      <section
        className="w-full max-w-lg rounded-lg border border-[#E4E7EC] bg-white p-8 shadow-sm"
        aria-labelledby="https-required-title"
      >
        <p className="m-0 text-[10px] font-medium uppercase tracking-[0.28em] text-[#6B7280]">
          {t("connectionLabel")}
        </p>
        <h1
          id="https-required-title"
          className="mt-4 font-display text-3xl font-semibold leading-tight text-[#18110F]"
        >
          {t("httpsRequiredTitle")}
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#6B7280]">
          {t("httpsRequiredDescription")}
        </p>
        <div className="mt-8">
          <button
            type="button"
            className="flex h-[42px] w-full items-center justify-center rounded-[8px] bg-[#18110F] text-sm font-medium text-white"
            onClick={handleOpenSecure}
          >
            {t("openSecureVersion")}
          </button>
        </div>
      </section>
    </div>
  );
}

export function HttpsRequiredPage() {
  return <HttpsRequiredPageContent />;
}

export function HttpsRequiredPageLocaleShell() {
  const [locale, setLocale] = useState<AppLocale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, unknown>>(enMessages);

  useEffect(() => {
    const resolvedLocale = readLocaleFromCookie();
    setLocale(resolvedLocale);
    void loadMessages(resolvedLocale).then(setMessages);
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <HttpsRequiredPageContent />
    </NextIntlClientProvider>
  );
}
