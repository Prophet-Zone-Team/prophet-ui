"use client";

import type { ReactNode } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("copyTrade.rank");
  const tCommon = useTranslations("copyTrade.common");

  const walletTypeOptions = useMemo(
    (): {
      id: CopyTradeRankWalletType;
      label: string;
      icon?: ReactNode;
    }[] => [
      { id: "all", label: t("filterAll") },
      {
        id: "whale",
        label: t("filterWhale"),
        icon: <WhaleIcon />
      },
      {
        id: "smart",
        label: t("filterSmartMoney"),
        icon: <SmartMoneyIcon />
      }
    ],
    [t]
  );

  const timeRangeOptions = useMemo(
    (): { id: CopyTradeRankTimeRange; label: string }[] => [
      { id: "1d", label: t("filter1d") },
      { id: "all", label: t("filterAll") }
    ],
    [t]
  );

  return (
    <div
      role="toolbar"
      aria-label={t("ariaFilters")}
      className={cn(
        "flex flex-col gap-3 px-4 md:flex-row md:items-center md:justify-between md:px-0",
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <FilterSegmentGroup aria-label={t("ariaWalletType")}>
          {walletTypeOptions.map((option) => (
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

        <FilterSegmentGroup aria-label={t("ariaTimeRange")}>
          {timeRangeOptions.map((option) => (
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
          className="inline-flex h-[34px] shrink-0 items-center gap-1.5 border-0 bg-transparent p-0 text-[14px] leading-[18px] text-prophet-muted transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t("ariaRefresh")}
          disabled={refreshing}
          onClick={onRefresh}
        >
          <RefreshCw
            className={cn("size-[13px]", refreshing && "animate-spin")}
            aria-hidden="true"
          />
          {tCommon("refresh")}
        </button>
      </div>

      <label className="relative block w-full md:w-[302px]">
        <span className="sr-only">{t("searchSrOnly")}</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-[14px] -translate-y-1/2 text-prophet-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          placeholder={t("searchPlaceholder")}
          className="box-border h-[34px] w-full rounded-[18px] border border-prophet-line bg-prophet-panel py-0 pl-9 pr-3 text-[14px] leading-[18px] text-prophet-foreground outline-none placeholder:text-prophet-muted focus-visible:border-prophet-muted"
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
      className="box-border inline-flex h-[34px] items-center gap-0.5 rounded-lg border border-prophet-line bg-prophet-panel px-1"
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
          ? "border-prophet-line bg-prophet-hover text-prophet-foreground"
          : "border-transparent bg-transparent text-prophet-muted hover:text-prophet-foreground"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
