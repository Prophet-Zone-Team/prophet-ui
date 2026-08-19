"use client";

import { useTranslations } from "next-intl";

import {
  MARKETS_NAV_ITEMS,
  type MarketsNavItemId
} from "@/views/markets/nav/config";
import { MarketsNavItem } from "@/views/markets/nav/markets-nav-item";

export interface MarketsNavProps {
  value: MarketsNavItemId;
  onChange: (id: MarketsNavItemId) => void;
}

export function MarketsNav({ value, onChange }: MarketsNavProps) {
  const t = useTranslations("marketsNav");

  return (
    <nav
      className="flex w-[198px] flex-col gap-1"
      aria-label={t("navigationAria")}
    >
      {MARKETS_NAV_ITEMS.map((item) => (
        <MarketsNavItem
          key={item.id}
          item={item}
          label={t(item.labelKey)}
          selected={value === item.id}
          onSelect={onChange}
        />
      ))}
    </nav>
  );
}
