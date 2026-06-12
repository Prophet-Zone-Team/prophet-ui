"use client";

import { useTranslations } from "next-intl";

import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";
import {
  depositSourceTabActiveClass,
  depositSourceTabDisabledClass,
  depositSourceTabInactiveClass,
  depositSourceTabsTrackClass,
} from "@/views/portfolio/deposit/deposit-ui";
import type { DepositEntryTab } from "@/views/portfolio/deposit/types";

export interface DepositSourceTabsProps {
  value: DepositEntryTab;
  onChange: (tab: DepositEntryTab) => void;
}

export function DepositSourceTabs({ value, onChange }: DepositSourceTabsProps) {
  const tWallet = useTranslations("wallet");
  const t = useTranslations("portfolio.deposit");
  const isMobile = useDevice();

  const tabs: Array<{
    id: DepositEntryTab;
    label: string;
    shortLabel?: string;
    disabled?: boolean;
    activeWidthClass?: string;
  }> = [
    { id: "crypto", label: t("byCrypto"), activeWidthClass: "md:min-w-[140px]" },
    {
      id: "private_balance",
      label: tWallet("privateBalance"),
      shortLabel: tWallet("privateBalanceShort"),
      activeWidthClass: "md:min-w-[160px]",
    },
    { id: "cash", label: t("byCash"), disabled: true },
  ];

  return (
    <div className={depositSourceTabsTrackClass} role="tablist" aria-label={t("sourceTabsAria")}>
      {tabs.map((tab) => {
        const isActive = value === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            className={cn(
              "truncate whitespace-nowrap",
              isActive ? depositSourceTabActiveClass : depositSourceTabInactiveClass,
              isActive && tab.activeWidthClass,
              tab.disabled && depositSourceTabDisabledClass,
            )}
            onClick={() => {
              if (!tab.disabled) {
                onChange(tab.id);
              }
            }}
          >
            {isMobile && tab.shortLabel ? tab.shortLabel : tab.label}
          </button>
        );
      })}
    </div>
  );
}
