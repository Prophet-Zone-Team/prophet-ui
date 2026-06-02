"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Pagination } from "@/components/pagination/pagination";
import { PORTFOLIO_TABLE_PAGE_SIZE } from "@/lib/portfolio/config";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import type { OpenOrderMarketContext } from "@/lib/portfolio/teams-condition";
import type {
  PortfolioLoadStatus,
  PortfolioTransactionRecord,
  UserOpenOrder
} from "@/lib/portfolio/types";
import type { TeamMarketSnapshot, UserPositionRecord } from "@/types/market";
import { PortfolioHistoryTable } from "@/views/portfolio/portfolio-history-table";
import { PortfolioOpenOrdersTable } from "@/views/portfolio/portfolio-open-orders-table";
import { PortfolioPositionsTable } from "@/views/portfolio/portfolio-positions-table";
import { portfolioActivityCardClass } from "@/views/portfolio/portfolio-ui";
import type { PortfolioLoadOptions } from "@/views/portfolio/use-portfolio-data";

const PORTFOLIO_TABS = [
  { id: "position", label: "Position" },
  { id: "open-order", label: "Open Order" },
  { id: "history", label: "History" }
] as const;

type PortfolioTabId = (typeof PORTFOLIO_TABS)[number]["id"];

function isTabLoading(status: PortfolioLoadStatus): boolean {
  return status === "loading" || status === "idle";
}

export interface PortfolioActivityTabsProps {
  snapshots: TeamMarketSnapshot[];
  positions: UserPositionRecord[];
  openOrders: UserOpenOrder[];
  openOrderMarketMap: Record<string, OpenOrderMarketContext>;
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
  snapshots,
  positions,
  openOrders,
  openOrderMarketMap,
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
  const [tab, setTab] = useState<PortfolioTabId>("position");
  const [positionPage, setPositionPage] = useState(1);
  const [openOrderPage, setOpenOrderPage] = useState(1);
  const loadedTabsRef = useRef<Set<PortfolioTabId>>(new Set());

  useEffect(() => {
    if (!sessionConnected) {
      loadedTabsRef.current = new Set();
      return;
    }

    if (tab === "position") {
      if (!loadedTabsRef.current.has("position")) {
        loadedTabsRef.current.add("position");
        void loadCore({ force: true, silent: true });
      }
      return;
    }

    if (tab === "open-order") {
      if (!loadedTabsRef.current.has("open-order")) {
        loadedTabsRef.current.add("open-order");
        void loadOpenOrders();
      }
      return;
    }

    if (!loadedTabsRef.current.has("history")) {
      loadedTabsRef.current.add("history");
      void loadActivityHistory({ page: historyPage });
    }
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

  const paginatedOpenOrders = useMemo(() => {
    const start = (openOrderPage - 1) * PORTFOLIO_TABLE_PAGE_SIZE;
    return openOrders.slice(start, start + PORTFOLIO_TABLE_PAGE_SIZE);
  }, [openOrderPage, openOrders]);

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
      Math.ceil(openOrders.length / PORTFOLIO_TABLE_PAGE_SIZE)
    );

    if (openOrderPage > totalPages) {
      setOpenOrderPage(totalPages);
    }
  }, [openOrderPage, openOrders.length]);

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
    openOrders.length > 0;

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
            snapshots={snapshots}
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
            openOrders={paginatedOpenOrders}
            openOrderMarketMap={openOrderMarketMap}
            snapshots={snapshots}
            needsWallet={needsWallet}
            loading={openOrdersLoading}
            onConnectWallet={onConnectWallet}
          />
          {showOpenOrderPagination ? (
            <Pagination
              page={openOrderPage}
              pageSize={PORTFOLIO_TABLE_PAGE_SIZE}
              total={openOrders.length}
              onPageChange={setOpenOrderPage}
            />
          ) : null}
        </>
      ) : null}

      {tab === "history" ? (
        <>
          <PortfolioHistoryTable
            transactions={transactions}
            snapshots={snapshots}
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
