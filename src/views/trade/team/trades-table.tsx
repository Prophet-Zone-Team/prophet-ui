"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Pagination } from "@/components/pagination/pagination";
import { cn } from "@/lib/cn";
import { formatPriceCents } from "@/lib/market/order-math";
import { fetchJson } from "@/lib/team/client-fetch";
import {
  formatShortWallet,
  formatTeamDetailMoney,
  formatUnixRelativeTime
} from "@/lib/team/detail-format";
import type { MarketTradeRecord, TeamMarketSnapshot } from "@/types/market";

const TRADES_PAGE_SIZE = 20;

interface TradesTableProps {
  snapshot: TeamMarketSnapshot;
}

function resolveTraderLabel(trade: MarketTradeRecord): string {
  if (trade.name?.trim()) {
    return trade.name.trim();
  }

  if (trade.pseudonym?.trim()) {
    return trade.pseudonym.trim();
  }

  return formatShortWallet(trade.proxyWallet);
}

export function TradesTable({ snapshot }: TradesTableProps) {
  const conditionId = snapshot.market.polymarket?.conditionId;
  const [trades, setTrades] = useState<MarketTradeRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const emptyMessage = useMemo(
    () => `No recent trades for ${snapshot.team.name}.`,
    [snapshot.team.name]
  );

  const loadTrades = useCallback(
    async (nextPage: number, signal?: { ignore: boolean }) => {
      setLoading(true);
      setError(null);

      if (!conditionId) {
        if (!signal?.ignore) {
          setTrades([]);
          setHasMore(false);
          setLoading(false);
        }
        return;
      }

      try {
        const offset = (nextPage - 1) * TRADES_PAGE_SIZE;
        const payload = await fetchJson<{ trades?: MarketTradeRecord[] }>(
          `/api/market/trades?market=${encodeURIComponent(conditionId)}&limit=${TRADES_PAGE_SIZE}&offset=${offset}`
        );
        const nextTrades = payload.trades ?? [];

        if (!signal?.ignore) {
          setTrades(nextTrades);
          setHasMore(nextTrades.length === TRADES_PAGE_SIZE);
        }
      } catch (loadError) {
        if (!signal?.ignore) {
          setTrades([]);
          setHasMore(false);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load market trades."
          );
        }
      } finally {
        if (!signal?.ignore) {
          setLoading(false);
        }
      }
    },
    [conditionId]
  );

  useEffect(() => {
    const signal = { ignore: false };

    void loadTrades(page, signal);

    return () => {
      signal.ignore = true;
    };
  }, [loadTrades, page]);

  const paginationTotal = useMemo(() => {
    if (trades.length === 0 && page === 1) {
      return 0;
    }

    return (page - 1) * TRADES_PAGE_SIZE + trades.length + (hasMore ? 1 : 0);
  }, [hasMore, page, trades.length]);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">
        Loading trades…
      </p>
    );
  }

  if (!conditionId) {
    return (
      <p className="px-4 py-10 text-center text-sm text-prophet-muted">
        Trade data is unavailable because this market has no connected condition
        ID.
      </p>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-10 text-center">
        <strong className="block text-sm font-[556] text-black">
          Market trades unavailable
        </strong>
        <p className="m-0 mt-2 text-sm text-prophet-muted">{error}</p>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-prophet-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div>
      {trades.map((trade) => (
        <div
          key={`${trade.transactionHash ?? trade.timestamp}:${trade.proxyWallet}:${trade.asset}:${trade.side}`}
          className="grid grid-cols-[minmax(0,0.8fr)_repeat(5,minmax(0,1fr))] gap-2 border-b border-prophet-line/60 px-4 py-2.5 text-sm last:border-b-0"
        >
          <span className="truncate text-prophet-muted">
            {formatUnixRelativeTime(trade.timestamp)}
          </span>
          <span className="truncate">{trade.outcome}</span>
          <span
            className={cn(
              trade.side === "BUY" ? "text-prophet-green" : "text-prophet-red"
            )}
          >
            {trade.side}
          </span>
          <span className="tabular-nums">{formatPriceCents(trade.price)}</span>
          <span className="tabular-nums">
            {formatTeamDetailMoney(trade.size * trade.price)}
          </span>
          <span className="truncate">{resolveTraderLabel(trade)}</span>
        </div>
      ))}

      <Pagination
        page={page}
        pageSize={TRADES_PAGE_SIZE}
        total={paginationTotal}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export function TradesTableHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,0.8fr)_repeat(5,minmax(0,1fr))] gap-2 border-b border-prophet-line px-4 py-2 text-xs text-prophet-muted">
      <span>Time</span>
      <span>Type</span>
      <span>Side</span>
      <span>Price</span>
      <span>Value</span>
      <span>Trader</span>
    </div>
  );
}
