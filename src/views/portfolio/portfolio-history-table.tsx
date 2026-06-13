"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ProphetMarkIcon } from "@/components/icons/prophet-mark-icon";
import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import {
  formatPortfolioDateTime,
  formatPortfolioTransactionMarketName,
  formatSharePrice,
  getOutcomeToneClass,
  titleCase
} from "@/lib/portfolio/portfolio-format";
import type {
  PortfolioTransactionRecord,
  PortfolioTransactionType
} from "@/lib/portfolio/types";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { PortfolioEmptyState } from "@/views/portfolio/portfolio-empty-state";
import {
  portfolioConnectButtonClass,
  portfolioHistoryListClass,
  portfolioHistoryMobileCardClass,
  portfolioHistoryRowClass,
  portfolioHistoryTableHeadClass,
  portfolioTableMobileLabelClass,
  portfolioTableMobileListClass,
  portfolioTableMobileValueClass,
  portfolioTableScrollClass
} from "@/views/portfolio/portfolio-ui";

const STRATEGY_PAGE_HREF = "/strategy/available";

function StrategySourceLabel() {
  const t = useTranslations("portfolio");

  return (
    <Link
      href={STRATEGY_PAGE_HREF}
      className="inline-flex h-6 w-[75px] shrink-0 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-black to-[#666666] font-[Sora] text-[10px] font-normal leading-[13px] text-white no-underline backdrop-blur-[5px] transition-opacity hover:opacity-90"
      aria-label={t("viewStrategy")}
    >
      {t("strategy")}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1.25 6.75L6.75 1.25M6.75 1.25H2.25M6.75 1.25V5.75"
          stroke="white"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

function PortfolioHistoryTableHeader() {
  const t = useTranslations("portfolio");

  return (
    <div className={portfolioHistoryTableHeadClass} role="row">
      <span role="columnheader">{t("action")}</span>
      <span role="columnheader">{t("market")}</span>
      <span role="columnheader">{t("value")}</span>
      <span className="text-right" role="columnheader">
        {t("time")}
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
  const t = useTranslations("portfolio");
  const price = Number(transaction.price);
  const priceLabel = Number.isFinite(price)
    ? formatSharePrice(price)
    : transaction.price;
  const outcomeLine = `${transaction.side} ${priceLabel}`;
  const sharesLabel =
    transaction.size != null && Number.isFinite(transaction.size)
      ? t("sharesCount", { count: transaction.size.toFixed(1) })
      : null;
  const nonMarketLabels: Partial<Record<PortfolioTransactionType, string>> = {
    withdraw: t("txTypeWithdraw"),
    deposit: t("txTypeDeposit"),
    claim: t("txTypeClaim")
  };
  const nonMarketLabel = nonMarketLabels[transaction.type];

  if (nonMarketLabel) {
    return (
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <ProphetMarkIcon className="size-[30px]" aria-hidden="true" />
        <p className="m-0 truncate text-[14px] font-medium leading-[18px] text-black">
          {nonMarketLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 md:gap-3">
      <div className="w-[30px]">
        {transaction.teamName ? (
          <TeamFlag
            name={transaction.teamName}
            className="size-[30px] shrink-0 rounded-[2px] text-[30px]"
          />
        ) : (
          <ProphetMarkIcon
            className="size-[30px] shrink-0 rounded-[2px]"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="m-0 truncate text-[14px] font-medium leading-[18px] text-black">
          {formatPortfolioTransactionMarketName(transaction)}
        </p>
        <p
          className={cn(
            "m-0 mt-0.5 text-[12px] font-normal leading-[15px]",
            getOutcomeToneClass(transaction.side)
          )}
        >
          {outcomeLine}
          {sharesLabel ? (
            <span className="ml-1 text-prophet-muted">{sharesLabel}</span>
          ) : null}
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
  const t = useTranslations("portfolio");
  const txActionLabels: Record<PortfolioTransactionType, string> = {
    buy: t("txActionBuy"),
    sell: t("txActionSell"),
    redeem: t("txActionRedeem"),
    deposit: t("txActionDeposit"),
    withdraw: t("txActionWithdraw"),
    claim: t("txActionClaim")
  };
  const actionLabel = txActionLabels[transaction.type] ?? titleCase(transaction.type);

  const showStrategyLabel = transaction.source === "strategy";

  return (
    <>
      <div className="flex items-center gap-2">
        <TransactionActionIcon type={transaction.type} />
        <span className="text-[14px] font-normal leading-[18px] text-black">
          {actionLabel}
        </span>
        {showStrategyLabel ? <StrategySourceLabel /> : null}
      </div>

      <HistoryMarketCell transaction={transaction} />

      <span className="hidden text-[14px] font-normal leading-[18px] text-black md:block">
        {formatTeamDetailMoney(Number(transaction.amount))}
      </span>

      <span className="hidden text-right text-[14px] font-normal leading-[18px] text-black md:block">
        {formatPortfolioDateTime(transaction.tradeCreatedAt)}
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
  variant: "desktop" | "mobile",
  t: ReturnType<typeof useTranslations<"portfolio">>
): ReactNode {
  const txActionLabels: Record<PortfolioTransactionType, string> = {
    buy: t("txActionBuy"),
    sell: t("txActionSell"),
    redeem: t("txActionRedeem"),
    deposit: t("txActionDeposit"),
    withdraw: t("txActionWithdraw"),
    claim: t("txActionClaim")
  };
  const showStrategyLabel = transaction.source === "strategy";

  if (variant === "mobile") {
    return (
      <article
        key={`${transaction.id}-mobile`}
        className={portfolioHistoryMobileCardClass}
      >
        <div className="flex flex-wrap items-center gap-2">
          <TransactionActionIcon type={transaction.type} />
          <span className="text-[14px] font-normal text-black">
            {txActionLabels[transaction.type] ?? titleCase(transaction.type)}
          </span>
          {showStrategyLabel ? <StrategySourceLabel /> : null}
        </div>
        <HistoryMarketCell transaction={transaction} />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={portfolioTableMobileLabelClass}>{t("value")}</p>
            <p className={portfolioTableMobileValueClass}>
              {formatTeamDetailMoney(Number(transaction.amount))}
            </p>
          </div>
          <div className="text-right">
            <p className={portfolioTableMobileLabelClass}>{t("time")}</p>
            <p className={cn(portfolioTableMobileValueClass, "font-normal")}>
              {formatPortfolioDateTime(transaction.tradeCreatedAt)}
            </p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <div key={transaction.id} className={portfolioHistoryRowClass}>
      <HistoryRowContent transaction={transaction} />
    </div>
  );
}

export function PortfolioHistoryTable({
  transactions,
  needsWallet,
  loading,
  onConnectWallet
}: PortfolioHistoryTableProps) {
  const t = useTranslations("portfolio");

  if (loading) {
    return (
      <p className="px-4 py-8 text-center text-sm text-prophet-muted">
        {t("loadingTransactionHistory")}
      </p>
    );
  }

  if (needsWallet) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <p className="m-0 text-sm text-prophet-muted">
          {t("connectWalletToViewHistory")}
        </p>
        <button
          type="button"
          className={portfolioConnectButtonClass}
          onClick={() => void onConnectWallet()}
        >
          {t("connectWallet")}
        </button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={portfolioTableScrollClass} aria-label={t("transactionHistory")}>
        <div className={cn(portfolioHistoryListClass, "hidden md:block")}>
          <PortfolioHistoryTableHeader />
        </div>
        <PortfolioEmptyState
          title={t("noTransactionHistory")}
          body={t("noTransactionHistoryBody")}
        />
      </div>
    );
  }

  const desktopRows: ReactNode[] = [];
  const mobileCards: ReactNode[] = [];

  transactions.forEach((transaction) => {
    desktopRows.push(renderHistoryRow(transaction, "desktop", t));
    mobileCards.push(renderHistoryRow(transaction, "mobile", t));
  });

  return (
    <div className={portfolioTableScrollClass} aria-label={t("transactionHistory")}>
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
