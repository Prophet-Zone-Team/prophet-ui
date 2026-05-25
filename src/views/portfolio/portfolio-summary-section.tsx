"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { CheckIcon, CopyIcon } from "@/components/icons";
import { usePendingFunderUsdc } from "@/hooks/funding";
import { formatShortWallet } from "@/lib/team/detail-format";
import { WalletAvatar } from "@/layout/header/wallet-avatar";
import { DepositDialog } from "@/views/portfolio/deposit";
import { PortfolioPerformanceChart } from "@/views/portfolio/portfolio-performance-chart";
import { WithdrawDialog } from "@/views/portfolio/withdraw";
import {
  portfolioConnectButtonClass,
  portfolioDepositButtonClass,
  portfolioPendingDepositButtonClass,
  portfolioSummaryCardClass,
  portfolioSummaryLabelClass,
  portfolioSummaryValueLargeClass,
  portfolioSummaryValueMediumClass,
  portfolioWalletAddressClass,
  portfolioWithdrawButtonClass
} from "@/views/portfolio/portfolio-ui";
import { formatNumber } from "@/utils";
import { usePortfolioContext } from "./context";

export interface PortfolioSummarySectionProps {}

export function PortfolioSummarySection({}: PortfolioSummarySectionProps) {
  const { session, portfolio, status, onConnectWallet, reload } =
    usePortfolioContext();

  const [copied, setCopied] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const polymarketAddress = session?.funderAddress ?? session?.walletAddress;

  const { hasPendingDeposit, converting, confirmPendingDeposit } =
    usePendingFunderUsdc({
      enabled: Boolean(session)
    });

  const copyAddress = useCallback(async () => {
    if (!polymarketAddress) {
      return;
    }

    try {
      await navigator.clipboard.writeText(polymarketAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [polymarketAddress]);

  const onConfirmPendingDeposit = async () => {
    try {
      await confirmPendingDeposit();
      toast.success("Deposit successful");
      reload();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    }
  };

  const portfolioDisplay = session
    ? formatNumber(portfolio?.portfolioValue, 2, true, {
        round: 0,
        isZeroPrecision: true
      })
    : "—";
  const availableDisplay = session
    ? formatNumber(portfolio?.availableToTrade, 2, true, {
        round: 0,
        isZeroPrecision: true
      })
    : "—";

  return (
    <section
      className={portfolioSummaryCardClass}
      aria-label="Portfolio summary"
    >
      <div className="flex items-center gap-3">
        {session ? (
          <WalletAvatar
            address={session.funderAddress ?? session.walletAddress}
            size="lg"
          />
        ) : (
          <div
            className="size-[52px] shrink-0 rounded-full border-4 border-white bg-prophet-line shadow-[0_0_4px_rgba(0,0,0,0.25)]"
            aria-hidden="true"
          />
        )}
        {session ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className={portfolioWalletAddressClass}>
              {formatShortWallet(polymarketAddress)}
            </span>
            <button
              type="button"
              onClick={() => void copyAddress()}
              className="shrink-0 border-0 bg-transparent p-0 text-prophet-muted transition-colors hover:text-black"
              aria-label={copied ? "Copied" : "Copy Polymarket address"}
              title={copied ? "Copied" : "Copy Polymarket address"}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        ) : (
          <span className="text-xl font-[556] leading-6 text-prophet-muted">
            Wallet not connected
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="w-1/2 flex flex-col justify-between pt-2 h-[160px]">
          <div className="flex items-end gap-8 sm:gap-12">
            <div className="flex flex-col gap-1">
              <span className={portfolioSummaryLabelClass}>Portfolio</span>
              <strong className={portfolioSummaryValueLargeClass}>
                {portfolioDisplay}
              </strong>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={portfolioSummaryLabelClass}>
                  Available to trade
                </span>
                {session && hasPendingDeposit ? (
                  <button
                    type="button"
                    className={portfolioPendingDepositButtonClass}
                    disabled={converting}
                    onClick={() => void onConfirmPendingDeposit()}
                  >
                    {converting ? (
                      <Loader2
                        className="mr-1.5 h-3.5 w-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : null}
                    Confirm pending deposit
                  </button>
                ) : null}
              </div>
              <strong className={portfolioSummaryValueMediumClass}>
                {availableDisplay}
              </strong>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            {!session ? (
              <button
                type="button"
                className={portfolioConnectButtonClass}
                onClick={() => void onConnectWallet()}
                disabled={status === "loading"}
              >
                {status === "loading" ? "Connecting…" : "Connect Wallet"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={portfolioDepositButtonClass}
                  onClick={() => setDepositOpen(true)}
                >
                  Deposit
                </button>
                <button
                  type="button"
                  className={portfolioWithdrawButtonClass}
                  onClick={() => setWithdrawOpen(true)}
                >
                  Withdraw
                </button>
              </>
            )}
          </div>
        </div>

        <div
          className="hidden w-px shrink-0 self-stretch bg-prophet-line lg:block"
          aria-hidden="true"
        />

        <PortfolioPerformanceChart />
      </div>

      {session ? (
        <>
          <DepositDialog
            open={depositOpen}
            onClose={() => setDepositOpen(false)}
            onDepositSuccess={reload}
          />
          <WithdrawDialog
            open={withdrawOpen}
            onClose={() => setWithdrawOpen(false)}
          />
        </>
      ) : null}
    </section>
  );
}
