"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Pagination } from "@/components/pagination/pagination";
import { cn } from "@/lib/cn";
import { PORTFOLIO_TABLE_PAGE_SIZE } from "@/lib/portfolio/config";
import { groupOpenOrdersByMarket } from "@/lib/portfolio/group-open-orders";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import type { OpenOrderMarketContext } from "@/lib/portfolio/teams-condition";
import type {
  PortfolioLoadStatus,
  PortfolioTransactionRecord,
  UserOpenOrder
} from "@/lib/portfolio/types";
import type { UserPositionRecord } from "@/types/market";
import { PortfolioHistoryTable } from "@/views/portfolio/portfolio-history-table";
import { PortfolioOpenOrdersTable } from "@/views/portfolio/portfolio-open-orders-table";
import { PortfolioPositionsTable } from "@/views/portfolio/portfolio-positions-table";
import { PortfolioStrategyList } from "@/views/portfolio/strategy";
import { portfolioActivityCardClass } from "@/views/portfolio/portfolio-ui";
import type { PortfolioLoadOptions } from "@/views/portfolio/use-portfolio-data";

const PORTFOLIO_TABS = [
  { id: "position", label: "Position" },
  { id: "open-order", label: "Open Order" },
  { id: "strategy", label: "Strategy" },
  { id: "history", label: "History" }
] as const;

type PortfolioTabId = (typeof PORTFOLIO_TABS)[number]["id"];

function parsePortfolioTab(value: string | null): PortfolioTabId | null {
  if (value && PORTFOLIO_TABS.some((item) => item.id === value)) {
    return value as PortfolioTabId;
  }

  return null;
}

function isTabLoading(status: PortfolioLoadStatus): boolean {
  return status === "loading" || status === "idle";
}

export interface PortfolioActivityTabsProps {
  marketContextMap: Record<string, OpenOrderMarketContext>;
  positions: UserPositionRecord[];
  openOrders: UserOpenOrder[];
  transactions: PortfolioTransactionRecord[];
  historyPage: number;
  historyTotal: number;
  historyPageSize: number;
  positionTimeMap: Map<string, string>;
  sessionConnected: boolean;
  coreStatus: PortfolioLoadStatus;
  openOrdersStatus: PortfolioLoadStatus;
  historyStatus: PortfolioLoadStatus;
  onConnectWallet: () => void;
  onHistoryPageChange: (page: number) => void;
  loadCore: (options?: PortfolioLoadOptions) => Promise<void>;
  loadOpenOrders: (options?: PortfolioLoadOptions) => Promise<void>;
  loadActivityHistory: (options?: PortfolioLoadOptions) => Promise<void>;
}

export function PortfolioActivityTabs({
  marketContextMap,
  positions,
  openOrders,
  transactions,
  historyPage,
  historyTotal,
  historyPageSize,
  positionTimeMap,
  sessionConnected,
  coreStatus,
  openOrdersStatus,
  historyStatus,
  onConnectWallet,
  onHistoryPageChange,
  loadCore,
  loadOpenOrders,
  loadActivityHistory
}: PortfolioActivityTabsProps) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<PortfolioTabId>(
    () => parsePortfolioTab(searchParams.get("tab")) ?? "position"
  );
  const [positionPage, setPositionPage] = useState(1);
  const [openOrderPage, setOpenOrderPage] = useState(1);
  const loadedTabsRef = useRef<Set<PortfolioTabId>>(new Set());
  const prevTabRef = useRef<PortfolioTabId | null>(null);

  useEffect(() => {
    if (!sessionConnected) {
      loadedTabsRef.current = new Set();
      prevTabRef.current = null;
      return;
    }

    const previousTab = prevTabRef.current;

    if (tab === "position") {
      const isFirstVisit = !loadedTabsRef.current.has("position");
      const switchedBackToPosition =
        previousTab !== null && previousTab !== "position";

      if (isFirstVisit) {
        loadedTabsRef.current.add("position");
      } else if (switchedBackToPosition) {
        void loadCore({ force: true, silent: true });
      }

      prevTabRef.current = tab;
      return;
    }

    if (tab === "open-order") {
      const isFirstVisit = !loadedTabsRef.current.has("open-order");
      const switchedBackToOpenOrder =
        previousTab !== null && previousTab !== "open-order";

      if (isFirstVisit) {
        loadedTabsRef.current.add("open-order");
        void loadOpenOrders();
      } else if (switchedBackToOpenOrder) {
        void loadOpenOrders({ force: true, silent: true });
      }

      prevTabRef.current = tab;
      return;
    }

    if (tab === "strategy") {
      loadedTabsRef.current.add("strategy");
      prevTabRef.current = tab;
      return;
    }

    if (!loadedTabsRef.current.has("history")) {
      loadedTabsRef.current.add("history");
      void loadActivityHistory({ page: historyPage });
    }

    prevTabRef.current = tab;
  }, [
    historyPage,
    loadActivityHistory,
    loadCore,
    loadOpenOrders,
    sessionConnected,
    tab
  ]);

  const coreLoading = isTabLoading(coreStatus);
  const openOrdersLoading = sessionConnected && isTabLoading(openOrdersStatus);
  const needsWallet = !sessionConnected && !coreLoading;
  const historyLoading = sessionConnected && isTabLoading(historyStatus);

  const paginatedPositions = useMemo(() => {
    const start = (positionPage - 1) * PORTFOLIO_TABLE_PAGE_SIZE;
    return positions.slice(start, start + PORTFOLIO_TABLE_PAGE_SIZE);
  }, [positionPage, positions]);

  const openOrderMarketGroups = useMemo(
    () => groupOpenOrdersByMarket(openOrders),
    [openOrders]
  );

  const paginatedOpenOrderGroups = useMemo(() => {
    const start = (openOrderPage - 1) * PORTFOLIO_TABLE_PAGE_SIZE;
    return openOrderMarketGroups.slice(
      start,
      start + PORTFOLIO_TABLE_PAGE_SIZE
    );
  }, [openOrderMarketGroups, openOrderPage]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(positions.length / PORTFOLIO_TABLE_PAGE_SIZE)
    );

    if (positionPage > totalPages) {
      setPositionPage(totalPages);
    }
  }, [positionPage, positions.length]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(openOrderMarketGroups.length / PORTFOLIO_TABLE_PAGE_SIZE)
    );

    if (openOrderPage > totalPages) {
      setOpenOrderPage(totalPages);
    }
  }, [openOrderMarketGroups.length, openOrderPage]);

  const showPositionPagination =
    tab === "position" &&
    sessionConnected &&
    !coreLoading &&
    coreStatus !== "error" &&
    positions.length > 0;

  const showOpenOrderPagination =
    tab === "open-order" &&
    sessionConnected &&
    !openOrdersLoading &&
    openOrdersStatus !== "error" &&
    openOrderMarketGroups.length > 0;

  const showHistoryPagination =
    tab === "history" &&
    sessionConnected &&
    !historyLoading &&
    historyStatus !== "error" &&
    historyTotal > 0;

  return (
    <section
      className={portfolioActivityCardClass}
      aria-label="Portfolio activity"
    >
      <div className="shrink-0 overflow-x-auto border-b border-[#EBEBEB] px-3 pt-3 md:px-4">
        <TabSwitcher
          items={[...PORTFOLIO_TABS]}
          value={tab}
          onChange={(value) => setTab(value as PortfolioTabId)}
          aria-label="Portfolio activity"
          size="compact"
          className="min-w-max gap-4 md:gap-6"
        />
      </div>

      {tab === "position" ? (
        <>
          <PortfolioPositionsTable
            positions={paginatedPositions}
            marketContextMap={marketContextMap}
            positionTimeMap={positionTimeMap}
            needsWallet={needsWallet}
            loading={coreLoading}
            onConnectWallet={onConnectWallet}
          />
          {showPositionPagination ? (
            <Pagination
              page={positionPage}
              pageSize={PORTFOLIO_TABLE_PAGE_SIZE}
              total={positions.length}
              onPageChange={setPositionPage}
            />
          ) : null}
        </>
      ) : null}

      {tab === "open-order" ? (
        <>
          <PortfolioOpenOrdersTable
            marketGroups={paginatedOpenOrderGroups}
            marketContextMap={marketContextMap}
            needsWallet={needsWallet}
            loading={openOrdersLoading}
            onConnectWallet={onConnectWallet}
          />
          {showOpenOrderPagination ? (
            <Pagination
              page={openOrderPage}
              pageSize={PORTFOLIO_TABLE_PAGE_SIZE}
              total={openOrderMarketGroups.length}
              onPageChange={setOpenOrderPage}
            />
          ) : null}
        </>
      ) : null}

      <div className={cn(tab !== "strategy" && "hidden")}>
        <PortfolioStrategyList
          active={tab === "strategy"}
          sessionConnected={sessionConnected}
          onConnectWallet={onConnectWallet}
        />
      </div>

      {tab === "history" ? (
        <>
          <PortfolioHistoryTable
            transactions={transactions}
            needsWallet={needsWallet}
            loading={historyLoading}
            onConnectWallet={onConnectWallet}
          />
          {showHistoryPagination ? (
            <Pagination
              page={historyPage}
              pageSize={historyPageSize}
              total={historyTotal}
              onPageChange={onHistoryPageChange}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}
