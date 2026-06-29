"use client";

import type { ReactNode } from "react";
import { RefreshCw, Search } from "lucide-react";

import { cn } from "@/lib/cn";
import type {
  CopyTradeRankTimeRange,
  CopyTradeRankWalletType
} from "@/lib/copy-trade/trader-rank-filters";

import { SmartMoneyIcon, WhaleIcon } from "./trader-tag-icons";

export interface CopyTradeRankFilterToolbarProps {
  walletType: CopyTradeRankWalletType;
  timeRange: CopyTradeRankTimeRange;
  searchQuery: string;
  refreshing?: boolean;
  onWalletTypeChange: (value: CopyTradeRankWalletType) => void;
  onTimeRangeChange: (value: CopyTradeRankTimeRange) => void;
  onSearchQueryChange: (value: string) => void;
  onRefresh: () => void;
  className?: string;
}

const WALLET_TYPE_OPTIONS: {
  id: CopyTradeRankWalletType;
  label: string;
  icon?: ReactNode;
}[] = [
  { id: "all", label: "All" },
  {
    id: "whale",
    label: "Whale",
    icon: <WhaleIcon />
  },
  {
    id: "smart",
    label: "Smart Money",
    icon: <SmartMoneyIcon />
  }
];

const TIME_RANGE_OPTIONS: {
  id: CopyTradeRankTimeRange;
  label: string;
}[] = [
  { id: "1d", label: "1D" },
  { id: "all", label: "All" }
];

export function CopyTradeRankFilterToolbar({
  walletType,
  timeRange,
  searchQuery,
  refreshing = false,
  onWalletTypeChange,
  onTimeRangeChange,
  onSearchQueryChange,
  onRefresh,
  className
}: CopyTradeRankFilterToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Trader rank filters"
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <FilterSegmentGroup aria-label="Wallet type">
          {WALLET_TYPE_OPTIONS.map((option) => (
            <FilterSegmentButton
              key={option.id}
              active={walletType === option.id}
              onClick={() => onWalletTypeChange(option.id)}
            >
              {option.icon ? (
                <span className="inline-flex shrink-0 items-center" aria-hidden="true">
                  {option.icon}
                </span>
              ) : null}
              {option.label}
            </FilterSegmentButton>
          ))}
        </FilterSegmentGroup>

        <FilterSegmentGroup aria-label="Time range">
          {TIME_RANGE_OPTIONS.map((option) => (
            <FilterSegmentButton
              key={option.id}
              active={timeRange === option.id}
              onClick={() => onTimeRangeChange(option.id)}
            >
              {option.label}
            </FilterSegmentButton>
          ))}
        </FilterSegmentGroup>

        <button
          type="button"
          className="inline-flex h-[34px] shrink-0 items-center gap-1.5 border-0 bg-transparent p-0 text-[14px] leading-[18px] text-[#909090] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Refresh trader rank"
          disabled={refreshing}
          onClick={onRefresh}
        >
          <RefreshCw
            className={cn("size-[13px]", refreshing && "animate-spin")}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      <label className="relative block w-full md:w-[302px]">
        <span className="sr-only">Search by name or wallet</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-[14px] -translate-y-1/2 text-[#222429]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          placeholder="Search by name / wallet"
          className="box-border h-[34px] w-full rounded-[18px] border border-[#EBEBEB] bg-white py-0 pl-9 pr-3 text-[14px] leading-[18px] text-black outline-none placeholder:text-[#909090] focus-visible:border-[#909090]"
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />
      </label>
    </div>
  );
}

function FilterSegmentGroup({
  children,
  "aria-label": ariaLabel
}: {
  children: ReactNode;
  "aria-label": string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="box-border inline-flex h-[34px] items-center gap-0.5 rounded-lg border border-[#EBEBEB] bg-white px-1"
    >
      {children}
    </div>
  );
}

function FilterSegmentButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-[26px] shrink-0 items-center gap-1 rounded-md border px-2 text-[14px] leading-[18px] transition-colors",
        active
          ? "border-[#EBEBEB] bg-[#EBEBEB] text-black"
          : "border-transparent bg-transparent text-[#909090] hover:text-black"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
