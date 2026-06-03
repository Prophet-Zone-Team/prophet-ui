"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { CopyButton } from "@/components/feedback/copy-button";
import { CopyIcon } from "@/components/icons";
import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { usePendingFunderUsdc } from "@/hooks/funding";
import { formatShortWallet } from "@/lib/team/detail-format";
import { WalletAvatar } from "@/layout/header/wallet-avatar";
import { DepositDialog } from "@/views/portfolio/deposit";
import { PrivateTopupOnboarding } from "@/views/portfolio/private-topup/private-topup-onboarding";
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
import { cn } from "@/lib/cn";

export interface PortfolioSummarySectionProps { }

export function PortfolioSummarySection({ }: PortfolioSummarySectionProps) {
  const { session, portfolio, status, onConnectWallet, reload } =
    usePortfolioContext();

  const [depositOpen, setDepositOpen] = useState(false);
  const [privateTopupIntroOpen, setPrivateTopupIntroOpen] = useState(false);
  const [privateTopupGuideOpen, setPrivateTopupGuideOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const polymarketAddress = session?.funderAddress ?? session?.walletAddress;

  const { isRegionBlocked } = useAuth();
  const regionRestricted = Boolean(session && isRegionBlocked);

  const { hasPendingDeposit, converting, confirmPendingDeposit } =
    usePendingFunderUsdc({
      enabled: Boolean(session)
    });

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
      <div className="flex items-center gap-[20px]">
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
            <CopyButton
              text={polymarketAddress}
              ariaLabel="Copy Polymarket address"
              className="shrink-0 border-0 bg-transparent p-0 text-prophet-muted transition-colors hover:text-black"
            >
              <CopyIcon />
            </CopyButton>
          </div>
        ) : (
          <span className="text-[20px] font-[556] leading-6 text-prophet-muted">
            Wallet not connected
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="w-full md:w-1/2 flex flex-col justify-between pt-[20px] md:h-[160px] relative">
          <div className="flex">
            <div className="w-1/2">
              <div className={portfolioSummaryLabelClass}>Portfolio</div>
              <div className={portfolioSummaryValueLargeClass}>
                ${portfolioDisplay}
              </div>
            </div>
            <div className="w-1/2">
              <div className="flex flex-wrap items-center gap-2">
                <div className={portfolioSummaryLabelClass}>
                  Available to trade
                </div>
              </div>
              <strong className={portfolioSummaryValueMediumClass}>
                ${availableDisplay}
              </strong>
            </div>
          </div>
          {session && hasPendingDeposit ? (
            <RegionRestrictedControl restricted={regionRestricted}>
              <button
                type="button"
                className={portfolioPendingDepositButtonClass}
                disabled={converting || regionRestricted}
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
            </RegionRestrictedControl>
          ) : null}
          <div className="flex gap-3 mt-[20px]">
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
                <RegionRestrictedControl restricted={regionRestricted}>
                  <button
                    type="button"
                    className={cn(portfolioDepositButtonClass, "flex-1")}
                    disabled={regionRestricted}
                    onClick={() => setDepositOpen(true)}
                  >
                    Deposit
                  </button>
                </RegionRestrictedControl>
                <button
                  type="button"
                  className={cn(portfolioWithdrawButtonClass, "flex-1")}
                  onClick={() => setWithdrawOpen(true)}
                >
                  Withdraw
                </button>
              </>
            )}
          </div>
        </div>

        <div
          className="hidden w-px shrink-0 self-stretch bg-prophet-line md:block"
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
            onOpenPrivateTopup={() => {
              setDepositOpen(false);
              setPrivateTopupIntroOpen(true);
            }}
          />
          <PrivateTopupOnboarding
            introOpen={privateTopupIntroOpen}
            guideOpen={privateTopupGuideOpen}
            walletAddress={session.walletAddress}
            onIntroOpenChange={setPrivateTopupIntroOpen}
            onGuideOpenChange={setPrivateTopupGuideOpen}
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
