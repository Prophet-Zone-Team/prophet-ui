"use client";

import { useDevice } from "@/hooks/common/use-device";
import { cn } from "@/lib/cn";
import {
  depositSourceTabActiveClass,
  depositSourceTabDisabledClass,
  depositSourceTabInactiveClass,
  depositSourceTabsTrackClass,
} from "@/views/portfolio/deposit/deposit-ui";
import type { DepositEntryTab } from "@/views/portfolio/deposit/types";

const TABS: Array<{
  id: DepositEntryTab;
  label: string;
  disabled?: boolean;
  activeWidthClass?: string;
}> = [
    { id: "crypto", label: "By Crypto", activeWidthClass: "md:min-w-[140px]" },
    {
      id: "private_balance",
      label: "Private Balance",
      activeWidthClass: "md:min-w-[160px]",
    },
    { id: "cash", label: "By Cash", disabled: true },
  ];

export interface DepositSourceTabsProps {
  value: DepositEntryTab;
  onChange: (tab: DepositEntryTab) => void;
}

export function DepositSourceTabs({ value, onChange }: DepositSourceTabsProps) {
  const isMobile = useDevice();

  return (
    <div className={depositSourceTabsTrackClass} role="tablist" aria-label="Deposit source">
      {TABS.map((tab) => {
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
            {isMobile && tab.label === "Private Balance" ? "Private" : tab.label}
          </button>
        );
      })}
    </div>
  );
}
