"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Pagination } from "@/components/pagination/pagination";
import { cn } from "@/lib/cn";
import { formatPriceCents } from "@/lib/market/order-math";
import { fetchJson } from "@/lib/team/client-fetch";
import {
  formatShortWallet,
  formatTeamDetailMoney,
  formatUnixRelativeTime
} from "@/lib/team/detail-format";
import { useLocalizedTeamName } from "@/hooks/i18n/use-localized-team-name";
import type { MarketTradeRecord, TeamMarketSnapshot } from "@/types/market";

const TRADES_PAGE_SIZE = 20;
const TRADES_POLL_INTERVAL_MS = 10_000;

interface TradesTableProps {
  snapshot: TeamMarketSnapshot;
  active: boolean;
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

export function TradesTable({ snapshot, active }: TradesTableProps) {
  const t = useTranslations("trade");
  const teamDisplayName = useLocalizedTeamName(
    snapshot.team.code,
    snapshot.team.name
  );
  const conditionId = snapshot.market.polymarket?.conditionId;
  const [trades, setTrades] = useState<MarketTradeRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const prevActiveRef = useRef(false);
  const prevPageRef = useRef(page);

  const emptyMessage = useMemo(
    () => t("noRecentTrades", { teamName: teamDisplayName }),
    [t, teamDisplayName]
  );

  const loadTrades = useCallback(
    async (
      nextPage: number,
      options: { silent: boolean; pageChanged: boolean; ignoreRef: { ignore: boolean } }
    ) => {
      const { silent, pageChanged, ignoreRef } = options;

      if (!silent) {
        setLoading(true);
      }

      if (!silent) {
        setError(null);
      }

      if (pageChanged && !ignoreRef.ignore) {
        setTrades([]);
        setHasMore(false);
      }

      if (!conditionId) {
        if (!ignoreRef.ignore) {
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

        if (!ignoreRef.ignore) {
          setTrades(nextTrades);
          setHasMore(nextTrades.length === TRADES_PAGE_SIZE);
        }
      } catch (loadError) {
        if (!ignoreRef.ignore && !silent) {
          setTrades([]);
          setHasMore(false);
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("unableToLoadTrades")
          );
        }
      } finally {
        if (!ignoreRef.ignore) {
          setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      }
    },
    [conditionId, t]
  );

  useEffect(() => {
    if (!active) {
      prevActiveRef.current = false;
      return;
    }

    const pageChanged = prevPageRef.current !== page;
    prevActiveRef.current = true;
    prevPageRef.current = page;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const ignoreRef = { ignore: false };

    async function pollLoop(isInitial: boolean) {
      if (cancelled || ignoreRef.ignore) {
        return;
      }

      const silent = isInitial
        ? hasLoadedOnceRef.current && !pageChanged
        : true;

      await loadTrades(page, {
        silent,
        pageChanged: isInitial && pageChanged,
        ignoreRef
      });

      if (cancelled || ignoreRef.ignore) {
        return;
      }

      timeoutId = setTimeout(() => {
        void pollLoop(false);
      }, TRADES_POLL_INTERVAL_MS);
    }

    void pollLoop(true);

    return () => {
      cancelled = true;
      ignoreRef.ignore = true;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [active, loadTrades, page]);

  const paginationTotal = useMemo(() => {
    if (trades.length === 0 && page === 1) {
      return 0;
    }

    return (page - 1) * TRADES_PAGE_SIZE + trades.length + (hasMore ? 1 : 0);
  }, [hasMore, page, trades.length]);

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const hasData = trades.length > 0;

  if (!conditionId) {
    return (
      <p className="px-4 py-10 text-center text-sm text-prophet-muted">
        {t("tradesDataUnavailable")}
      </p>
    );
  }

  if (error && !hasData) {
    return (
      <div className="px-4 py-10 text-center">
        <strong className="block text-sm font-[500] text-prophet-foreground">
          {t("tradesUnavailable")}
        </strong>
        <p className="m-0 mt-2 text-sm text-prophet-muted">{error}</p>
      </div>
    );
  }

  if (loading && !hasData && !error) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">
        {t("loadingTrades")}
      </p>
    );
  }

  if (!loading && !hasData && !error) {
    return (
      <p className="px-4 py-10 text-center text-sm text-prophet-muted">
        {emptyMessage}
      </p>
    );
  }

  if (!hasData) {
    return null;
  }

  return (
    <div>
      {trades.map((trade) => (
        <div
          key={`${trade.transactionHash ?? trade.timestamp}:${trade.proxyWallet}:${trade.asset}:${trade.side}`}
          className="grid grid-cols-[minmax(0,0.8fr)_repeat(5,minmax(0,1fr))] gap-2 border-b border-prophet-line px-4 py-2.5 text-sm last:border-b-0"
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
  const t = useTranslations("trade");

  return (
    <div className="grid grid-cols-[minmax(0,0.8fr)_repeat(5,minmax(0,1fr))] gap-2 border-b border-prophet-line px-4 py-2 text-xs text-prophet-muted">
      <span>{t("time")}</span>
      <span>{t("type")}</span>
      <span>{t("side")}</span>
      <span>{t("price")}</span>
      <span>{t("value")}</span>
      <span>{t("trader")}</span>
    </div>
  );
}
