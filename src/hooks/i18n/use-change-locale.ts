"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import type { AppLocale } from "@/i18n/config";
import { applyLocaleChange } from "@/lib/i18n/change-locale";
import { useSetLocale } from "@/store/user-config-store";

export function useChangeLocale() {
  const setLocale = useSetLocale();
  const router = useRouter();

  return useCallback(
    async (locale: AppLocale) => {
      setLocale(locale);
      await applyLocaleChange(locale, {
        refresh: () => router.refresh()
      });
    },
    [router, setLocale]
  );
}
