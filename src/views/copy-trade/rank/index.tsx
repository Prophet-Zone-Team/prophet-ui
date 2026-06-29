"use client";

import { useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { traderRowKey } from "@/lib/copy-trade/trader-catalog-stats";
import type {
  CopyTradeRankTimeRange,
  CopyTradeRankWalletType
} from "@/lib/copy-trade/trader-rank-filters";
import type { TraderCatalogEntry } from "@/types/copy-trade-api";
import { CopyTradeListStatusMessage } from "@/views/copy-trade/list/status-message";
import { useCopyTradeRank } from "@/views/copy-trade/use-copy-trade-rank";
import {
  buildWalletCopyStatsFromTrader,
  WalletCopyModal
} from "@/views/copy-trade/wallet-copy-modal";

import { CopyTradeRankFilterToolbar } from "./filter-toolbar";
import { CopyTradeRankItem } from "./item";
import { CopyTradeRankTableHeader } from "./table-header";

export interface CopyTradeRankPanelProps {
  className?: string;
  enabled?: boolean;
}

export function CopyTradeRankPanel({
  className,
  enabled = true
}: CopyTradeRankPanelProps) {
  const [walletType, setWalletType] = useState<CopyTradeRankWalletType>("all");
  const [timeRange, setTimeRange] = useState<CopyTradeRankTimeRange>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [trackedWallets, setTrackedWallets] = useState<Set<string>>(
    () => new Set()
  );
  const [copyModalTrader, setCopyModalTrader] =
    useState<TraderCatalogEntry | null>(null);

  const handleTrackToggle = useCallback((trader: TraderCatalogEntry) => {
    setTrackedWallets((current) => {
      const next = new Set(current);
      if (next.has(trader.Wallet)) {
        next.delete(trader.Wallet);
      } else {
        next.add(trader.Wallet);
      }
      return next;
    });
  }, []);

  const filters = useMemo(
    () => ({
      walletType,
      timeRange,
      searchQuery
    }),
    [searchQuery, timeRange, walletType]
  );

  const {
    traders,
    isLoading,
    isFetching,
    isError,
    error: errorDetail,
    refetch
  } = useCopyTradeRank({ enabled, filters });

  const copyModalStats = useMemo(
    () =>
      copyModalTrader
        ? buildWalletCopyStatsFromTrader(copyModalTrader, timeRange)
        : undefined,
    [copyModalTrader, timeRange]
  );

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <CopyTradeRankFilterToolbar
        className="mt-4"
        walletType={walletType}
        timeRange={timeRange}
        searchQuery={searchQuery}
        refreshing={isFetching && !isLoading}
        onWalletTypeChange={setWalletType}
        onTimeRangeChange={setTimeRange}
        onSearchQueryChange={setSearchQuery}
        onRefresh={() => void refetch()}
      />

      <CopyTradeRankTableHeader className="mt-3 hidden md:grid" />
      <div className="mt-3 flex flex-col gap-y-2" aria-label="Trader rank list">
        {isLoading ? (
          <CopyTradeListStatusMessage>
            Loading traders…
          </CopyTradeListStatusMessage>
        ) : isError ? (
          <CopyTradeListStatusMessage>
            {errorDetail instanceof Error
              ? errorDetail.message
              : "Unable to load trader rank."}
          </CopyTradeListStatusMessage>
        ) : traders.length > 0 ? (
          traders.map((trader, index) => (
            <CopyTradeRankItem
              key={traderRowKey(trader)}
              rank={index + 1}
              trader={trader}
              timeRange={timeRange}
              tracked={trackedWallets.has(trader.Wallet)}
              onTrackToggle={handleTrackToggle}
              onCopyTrade={setCopyModalTrader}
            />
          ))
        ) : (
          <CopyTradeListStatusMessage>
            No traders available.
          </CopyTradeListStatusMessage>
        )}
      </div>

      <WalletCopyModal
        open={copyModalTrader != null}
        onClose={() => setCopyModalTrader(null)}
        wallet={copyModalTrader?.Wallet ?? ""}
        stats={copyModalStats}
      />
    </div>
  );
}
