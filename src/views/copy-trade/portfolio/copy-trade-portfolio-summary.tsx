"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import type { CopyWallet } from "@/types/copy-trade-api";
import { CopyTradeWalletIdentity } from "@/views/copy-trade/user-profile/copy-trade-wallet-identity";
import { PortfolioPerformanceChartContent } from "@/views/portfolio/portfolio-performance-chart-content";
import {
  portfolioSummaryCardClass,
  portfolioSummaryLabelClass,
  portfolioSummaryValueMediumClass
} from "@/views/portfolio/portfolio-ui";

export interface CopyTradePortfolioSummaryProps {
  copyWallet: CopyWallet;
  positionsValue: number | null;
  openPositions: number | null;
  isLoading?: boolean;
}

function formatStatValue(
  value: number | null,
  formatter: (next: number) => string
): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return formatter(value);
}

export function CopyTradePortfolioSummary({
  copyWallet,
  positionsValue,
  openPositions,
  isLoading = false
}: CopyTradePortfolioSummaryProps) {
  const t = useTranslations("copyTrade.portfolio");
  const displayAddress = copyWallet.CopyDepositWalletAddress;

  return (
    <section
      className={cn(
        portfolioSummaryCardClass,
        "flex min-h-[278px] flex-col gap-6 lg:min-h-[278px] lg:h-auto"
      )}
      aria-label={t("summaryAria")}
    >
      <CopyTradeWalletIdentity address={displayAddress} size="lg" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="flex w-full flex-col justify-between gap-6 lg:w-1/2 lg:pr-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className={portfolioSummaryLabelClass}>{t("positionsValue")}</div>
              <div
                className={cn(
                  portfolioSummaryValueMediumClass,
                  isLoading && "animate-pulse opacity-60"
                )}
              >
                {formatStatValue(positionsValue, (value) =>
                  formatTeamDetailMoney(value)
                )}
              </div>
            </div>
            <div>
              <div className={portfolioSummaryLabelClass}>{t("biggestWin")}</div>
              <div className={portfolioSummaryValueMediumClass}>—</div>
            </div>
            <div>
              <div className={portfolioSummaryLabelClass}>{t("predictions")}</div>
              <div
                className={cn(
                  portfolioSummaryValueMediumClass,
                  isLoading && "animate-pulse opacity-60"
                )}
              >
                {formatStatValue(openPositions, (value) => String(value))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="hidden w-px shrink-0 self-stretch bg-prophet-line lg:block"
          aria-hidden="true"
        />

        {/* TODO: wire copy-trade PnL series API — pass fetched series via seriesOverride */}
        <PortfolioPerformanceChartContent series={[]} />
      </div>
    </section>
  );
}
