"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { useChangeLocale } from "@/hooks/i18n/use-change-locale";
import { locales, type AppLocale } from "@/i18n/config";
import { LOCALE_LABELS, LOCALE_SHORT_LABELS } from "@/lib/i18n/locale-labels";
import { RightArrowIcon } from "@/components/icons";
import { LanguageIcon } from "@/layout/header/wallet-menu-icons";
import { walletMenuItemClass } from "@/layout/header/wallet-menu-ui";
import { useLocale } from "@/store/user-config-store";

interface WalletLanguageMenuItemProps {
  variant?: "menu" | "compact";
  onSelect?: () => void;
}

export function WalletLanguageMenuItem({
  variant = "menu",
  onSelect
}: WalletLanguageMenuItemProps) {
  const t = useTranslations("wallet");
  const locale = useLocale();
  const changeLocale = useChangeLocale();
  const [expanded, setExpanded] = useState(false);

  async function handleSelect(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      setExpanded(false);
      return;
    }

    await changeLocale(nextLocale);
    setExpanded(false);
    onSelect?.();
  }

  if (variant === "compact") {
    return (
      <div className="relative">
        <button
          type="button"
          className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-[20px] px-3 text-sm text-black transition-colors hover:bg-[#fafbfc]"
          aria-label={t("language")}
          aria-haspopup="listbox"
          onClick={() => setExpanded((value) => !value)}
        >
          <LanguageIcon />
          <span className="ml-1.5 text-xs font-medium">{LOCALE_SHORT_LABELS[locale]}</span>
        </button>
        {expanded ? (
          <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[140px] rounded-xl border border-prophet-line bg-white p-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
            {locales.map((item) => (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={item === locale}
                className={cn(
                  "flex w-full items-center rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-[#f3f8fd]",
                  item === locale ? "font-medium text-black" : "text-[#606060]"
                )}
                onClick={() => void handleSelect(item)}
              >
                {LOCALE_LABELS[item]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        role="menuitem"
        className={walletMenuItemClass}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="flex items-center gap-2">
          <div className="w-[14px]">
            <LanguageIcon />
          </div>
          <span>{t("language")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-[#909090]">{LOCALE_SHORT_LABELS[locale]}</span>
          <RightArrowIcon />
        </div>
      </button>

      {expanded ? (
        <div className="mt-1 flex flex-col gap-0.5 border-t border-prophet-line pt-1">
          {locales.map((item) => (
            <button
              key={item}
              type="button"
              role="menuitem"
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-[#f3f8fd]",
                item === locale ? "font-medium text-black" : "text-[#606060]"
              )}
              onClick={() => void handleSelect(item)}
            >
              <span>{LOCALE_LABELS[item]}</span>
              {item === locale ? (
                <span className="text-xs text-[#3168FF]">✓</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
