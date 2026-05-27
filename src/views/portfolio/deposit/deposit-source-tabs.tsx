"use client";

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
  { id: "crypto", label: "By Crypto", activeWidthClass: "min-w-[140px]" },
  {
    id: "private_balance",
    label: "Private Balance",
    activeWidthClass: "min-w-[160px]",
  },
  { id: "cash", label: "By Cash", disabled: true },
];

export interface DepositSourceTabsProps {
  value: DepositEntryTab;
  onChange: (tab: DepositEntryTab) => void;
}

export function DepositSourceTabs({ value, onChange }: DepositSourceTabsProps) {
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
              "whitespace-nowrap",
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
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
