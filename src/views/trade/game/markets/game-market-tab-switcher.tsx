"use client";

import { useTranslations } from "next-intl";

import {
  TabSwitcher,
  type TabSwitcherItem
} from "@/components/ui/tab-switcher";

export interface GameMarketTabSwitcherProps {
  items: TabSwitcherItem[];
  value: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
}

export function GameMarketTabSwitcher({
  items,
  value,
  onChange,
  "aria-label": ariaLabel
}: GameMarketTabSwitcherProps) {
  const t = useTranslations("trade");
  const resolvedAriaLabel = ariaLabel ?? t("matchMarketCategories");

  return (
    <div className="min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TabSwitcher
        items={items}
        value={value}
        onChange={onChange}
        aria-label={resolvedAriaLabel}
        tabLabelClassName="whitespace-nowrap text-[14px] leading-[17px] md:text-[16px] md:leading-[21px]"
        className="min-w-max gap-4 md:gap-6"
      />
    </div>
  );
}
