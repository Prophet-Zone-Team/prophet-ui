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
import type {
  PortfolioTransactionRecord,
  PortfolioTransactionType
} from "@/lib/portfolio/types";
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

const NON_MARKET_LABELS: Partial<Record<PortfolioTransactionType, string>> = {
  withdraw: "Withdraw",
  deposit: "Deposit",
  claim: "Claim Referral Earning"
};

function ProphetTransactionMarkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      className="size-[30px] shrink-0"
      aria-hidden="true"
    >
      <rect width="30" height="30" rx="15" fill="black" />
      <path
        d="M15.953 6.30142C17.9837 7.69147 19.3458 9.91585 19.4893 12.4482C22.1747 13.8154 24 16.5185 24 19.6179V20.0737L23.5637 20.2651C22.4821 20.7396 21.2881 20.9997 20.0239 20.9997C18.366 20.9996 16.8201 20.5472 15.5133 19.7653C14.2064 20.5474 12.6602 21 11.0022 21C9.71279 21 8.5349 20.7487 7.42951 20.251L7 20.0576V19.6068C7.00001 16.4963 8.83781 13.7914 11.5375 12.432C11.6857 9.90649 13.0462 7.68862 15.0723 6.30142L15.5126 6L15.953 6.30142ZM11.6105 14.0528C9.86379 15.1707 8.67267 17.0203 8.52095 19.1452C9.28924 19.429 10.1052 19.5737 11.0022 19.5737C12.1649 19.5737 13.2621 19.3023 14.2276 18.8223C12.8439 17.591 11.892 15.9245 11.6105 14.0528ZM19.4127 14.0712C19.1279 15.9354 18.1779 17.5949 16.7988 18.8222C17.7643 19.3021 18.8613 19.5733 20.0239 19.5733C20.8922 19.5733 21.7159 19.425 22.4786 19.1511C22.326 17.0368 21.1451 15.1925 19.4127 14.0712ZM15.5 12.9256C14.6363 12.9256 13.8088 13.0752 13.0445 13.3489C13.1762 15.2131 14.1079 16.866 15.5131 17.9991C16.9157 16.868 17.8463 15.2194 17.9807 13.3595C17.2093 13.0791 16.3731 12.9256 15.5 12.9256ZM15.5127 7.78546C14.2632 8.79335 13.3891 10.2111 13.1177 11.822C13.8734 11.612 14.6728 11.4993 15.5 11.4993C16.3373 11.4993 17.1459 11.615 17.9097 11.8305C17.6398 10.216 16.7646 8.79507 15.5127 7.78546Z"
        fill="white"
      />
    </svg>
  );
}

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
  const nonMarketLabel = NON_MARKET_LABELS[transaction.type];

  if (nonMarketLabel) {
    return (
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <ProphetTransactionMarkIcon />
        <p className="m-0 truncate text-[14px] font-medium leading-[18px] text-black">
          {nonMarketLabel}
        </p>
      </div>
    );
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

  if (type === "deposit") {
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
          d="M10 6V13.5M14 10.1906L10 13.5L6 10.1906"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
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
