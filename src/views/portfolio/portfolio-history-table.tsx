"use client";

import type { ReactNode } from "react";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import {
  formatPortfolioDateTime,
  formatTransactionPrice,
  getOutcomeToneClass,
  titleCase
} from "@/lib/portfolio/portfolio-format";
import type { PortfolioTransactionRecord } from "@/lib/portfolio/types";
import { resolveTradeHref } from "@/lib/routes/trade";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import {
  portfolioConnectButtonClass,
  portfolioHistoryListClass,
  portfolioHistoryMobileCardClass,
  portfolioHistoryRowLinkClass,
  portfolioHistoryTableHeadClass,
  portfolioTableMobileLabelClass,
  portfolioTableMobileListClass,
  portfolioTableMobileValueClass,
  portfolioTableScrollClass
} from "@/views/portfolio/portfolio-ui";

function PortfolioHistoryTableHeader() {
  return (
    <div className={portfolioHistoryTableHeadClass} role="row">
      <span role="columnheader">Action</span>
      <span role="columnheader">Market</span>
      <span role="columnheader">Value</span>
      <span className="text-right" role="columnheader">
        Time
      </span>
    </div>
  );
}

export interface PortfolioHistoryTableProps {
  transactions: PortfolioTransactionRecord[];
  needsWallet: boolean;
  loading: boolean;
  onConnectWallet: () => void;
}

function HistoryMarketCell({
  transaction
}: {
  transaction: PortfolioTransactionRecord;
}) {
  const outcomeLine = `${transaction.side} ${formatTransactionPrice(transaction.price)}`;
  const isFundingTransaction = transaction.type === "deposit" || transaction.type === "withdraw";

  if (isFundingTransaction) {
    return "-";
  }

  return (
    <div className="flex min-w-0 items-center gap-2 md:gap-3">
      {transaction.teamName ? (
        <TeamFlag
          name={transaction.teamName}
          className="size-[30px] shrink-0 rounded-[2px]"
        />
      ) : (
        <span
          className="flex size-[30px] shrink-0 items-center justify-center rounded-[2px] bg-prophet-line text-[10px] text-prophet-muted"
          aria-hidden="true"
        >
          ?
        </span>
      )}
      <div className="min-w-0">
        <p className="m-0 truncate text-[14px] font-medium leading-[18px] text-black">
          {transaction.marketName}
        </p>
        <p
          className={cn(
            "m-0 mt-0.5 text-[12px] font-normal leading-[15px]",
            getOutcomeToneClass(transaction.side)
          )}
        >
          {outcomeLine}
        </p>
      </div>
    </div>
  );
}

function HistoryRowContent({
  transaction
}: {
  transaction: PortfolioTransactionRecord;
}) {
  const actionLabel = titleCase(transaction.type);

  return (
    <>
      <div className="flex w-[72px] shrink-0 items-center gap-2">
        <TransactionActionIcon type={transaction.type} />
        <span className="text-[14px] font-normal leading-[18px] text-black">
          {actionLabel}
        </span>
      </div>

      <HistoryMarketCell transaction={transaction} />

      <span className="hidden text-[14px] font-normal leading-[18px] text-black md:block">
        {formatTeamDetailMoney(Number(transaction.amount))}
      </span>

      <span className="hidden text-right text-[14px] font-normal leading-[18px] text-black md:block">
        {formatPortfolioDateTime(transaction.createdAt)}
      </span>
    </>
  );
}

function TransactionActionIcon({
  type
}: {
  type: PortfolioTransactionRecord["type"];
}) {
  if (type === "sell") {
    return (
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#E97864]"
        aria-hidden="true"
      >
        <span className="h-px w-2 rounded-full bg-white" />
      </span>
    );
  }

  if (type === "redeem") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="shrink-0"
      >
        <circle cx="10" cy="10" r="10" fill="#C9A227" />
        <path
          d="M10 13.5V6M14 9.3094L10 6L6 9.3094"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "buy") {
    return (
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#65AF14]"
        aria-hidden="true"
      >
        <span className="relative size-2">
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white" />
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white" />
        </span>
      </span>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="shrink-0"
    >
      <circle cx="10" cy="10" r="10" fill="#909090" />
      <path
        d="M10 13.5V6M14 9.3094L10 6L6 9.3094"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function renderHistoryRow(
  transaction: PortfolioTransactionRecord,
  variant: "desktop" | "mobile"
): ReactNode {
  const href = transaction.slug ? resolveTradeHref(transaction.slug) : undefined;

  if (variant === "mobile") {
    const card = (
      <article className={portfolioHistoryMobileCardClass}>
        <div className="flex items-center gap-2">
          <TransactionActionIcon type={transaction.type} />
          <span className="text-[14px] font-normal text-black">
            {titleCase(transaction.type)}
          </span>
        </div>
        <HistoryMarketCell transaction={transaction} />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={portfolioTableMobileLabelClass}>Value</p>
            <p className={portfolioTableMobileValueClass}>
              {formatTeamDetailMoney(Number(transaction.amount))}
            </p>
          </div>
          <div className="text-right">
            <p className={portfolioTableMobileLabelClass}>Time</p>
            <p className={cn(portfolioTableMobileValueClass, "font-normal")}>
              {formatPortfolioDateTime(transaction.createdAt)}
            </p>
          </div>
        </div>
      </article>
    );

    if (href) {
      return (
        <a key={`${transaction.id}-mobile`} href={href} className="no-underline text-inherit">
          {card}
        </a>
      );
    }

    return <div key={`${transaction.id}-mobile`}>{card}</div>;
  }

  const row = <HistoryRowContent transaction={transaction} />;

  if (href) {
    return (
      <a
        key={transaction.id}
        href={href}
        className={portfolioHistoryRowLinkClass}
      >
        {row}
      </a>
    );
  }

  return (
    <div key={transaction.id} className={portfolioHistoryRowLinkClass}>
      {row}
    </div>
  );
}

export function PortfolioHistoryTable({
  transactions,
  needsWallet,
  loading,
  onConnectWallet
}: PortfolioHistoryTableProps) {
  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">
        Loading transaction history…
      </p>
    );
  }

  if (needsWallet) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <p className="m-0 text-sm text-prophet-muted">
          Connect your wallet to view transaction history in your connected account.
        </p>
        <button
          type="button"
          className={portfolioConnectButtonClass}
          onClick={() => void onConnectWallet()}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={portfolioTableScrollClass} aria-label="Transaction history">
        <div className={cn(portfolioHistoryListClass, "hidden md:block")}>
          <PortfolioHistoryTableHeader />
        </div>
        <PortfolioEmptyState
          title="No transaction history"
          body="Trade activity reported to your Prophet account will appear here."
        />
      </div>
    );
  }

  const desktopRows: ReactNode[] = [];
  const mobileCards: ReactNode[] = [];

  transactions.forEach((transaction) => {
    desktopRows.push(renderHistoryRow(transaction, "desktop"));
    mobileCards.push(renderHistoryRow(transaction, "mobile"));
  });

  return (
    <div className={portfolioTableScrollClass} aria-label="Transaction history">
      <div className={cn(portfolioHistoryListClass, "hidden md:block")}>
        <PortfolioHistoryTableHeader />
        {desktopRows}
      </div>
      <div className={cn(portfolioTableMobileListClass, "px-3 py-2 md:hidden")}>
        {mobileCards}
      </div>
    </div>
  );
}
