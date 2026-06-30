"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import type { LimitExpirationPreset } from "@/store/trade-ticket-store";
import {
  getLimitExpirationLabel,
  LIMIT_EXPIRATION_OPTION_KEYS,
  LIMIT_EXPIRATION_PRESETS
} from "@/views/trade/trade-widget/trade-i18n";
import { tradeMarketButtonClass } from "@/views/trade/trade-widget/trade-ui";

export interface LimitExpirationSelectProps {
  value: LimitExpirationPreset;
  customDate?: string;
  onChange: (value: LimitExpirationPreset) => void;
  onCustomDateChange: (value: string) => void;
}

export function LimitExpirationSelect({
  value,
  customDate,
  onChange,
  onCustomDateChange
}: LimitExpirationSelectProps) {
  const t = useTranslations("trade");
  const locale = useLocale();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = getLimitExpirationLabel(t, value, customDate, locale);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  function selectOption(nextValue: LimitExpirationPreset) {
    onChange(nextValue);
    setIsOpen(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={t("orderExpiration")}
          className={cn(tradeMarketButtonClass, "cursor-pointer")}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span>{selectedLabel}</span>
          <svg
            width="8"
            height="5"
            viewBox="0 0 8 5"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <path
              d="M1 1L4 4L7 1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isOpen ? (
          <div
            role="listbox"
            aria-label={t("orderExpiration")}
            className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[140px] overflow-hidden rounded-md border border-prophet-line bg-prophet-panel py-1 shadow-prophet"
          >
            {LIMIT_EXPIRATION_PRESETS.map((preset) => {
              const isSelected = preset === value;

              return (
                <button
                  key={preset}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "block w-full px-3 py-1.5 text-left text-sm font-[500] leading-[17px] transition-colors",
                    isSelected
                      ? "bg-[#fafbfc] text-prophet-foreground"
                      : "text-prophet-muted hover:bg-[#fafbfc] hover:text-prophet-foreground"
                  )}
                  onClick={() => selectOption(preset)}
                >
                  {t(LIMIT_EXPIRATION_OPTION_KEYS[preset])}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {value === "custom" ? (
        <input
          type="datetime-local"
          aria-label={t("expirationCustomDateSrOnly")}
          value={customDate ?? ""}
          onChange={(event) => onCustomDateChange(event.target.value)}
          className="rounded-md border border-prophet-line px-2 py-1 text-xs font-[400] text-prophet-foreground"
        />
      ) : null}
    </div>
  );
}
