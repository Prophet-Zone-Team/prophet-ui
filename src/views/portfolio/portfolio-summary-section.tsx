"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { PolymarketAddressCopyButton } from "@/components/trading/polymarket-address-copy-button";
import { CopyIcon } from "@/components/icons";
import { RegionRestrictedControl } from "@/components/trading/region-restricted-control";
import { useAuth } from "@/context/auth";
import { useTpPolygonSwitchGate } from "@/hooks/funding/use-tp-polygon-switch-gate";
import { formatShortWallet } from "@/lib/team/detail-format";
import { WalletAvatar } from "@/layout/header/wallet-avatar";
import { useDepositDialogStore } from "@/store/use-deposit-dialog";
import { PrivateTopupOnboarding } from "@/views/portfolio/private-topup/private-topup-onboarding";
import { PortfolioPerformanceChart } from "@/views/portfolio/portfolio-performance-chart";
import { WithdrawDialog } from "@/views/portfolio/withdraw";
import {
  portfolioConnectButtonClass,
  portfolioDepositButtonClass,
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
import { depositPendingConfirmButtonClass } from "./deposit/deposit-ui";
import { TpPolygonSwitchConfirmDialog } from "./deposit/tp-polygon-switch-confirm-dialog";
import { Loader2 } from "lucide-react";

export interface PortfolioSummarySectionProps { }

export function PortfolioSummarySection({ }: PortfolioSummarySectionProps) {
  const t = useTranslations("portfolio");
  const {
    session,
    portfolio,
    status,
    onConnectWallet,
    reload
  } = usePortfolioContext();

  const [privateTopupIntroOpen, setPrivateTopupIntroOpen] = useState(false);
  const [privateTopupGuideOpen, setPrivateTopupGuideOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const openDepositDialog = useDepositDialogStore((state) => state.open);

  const polymarketAddress = session?.funderAddress ?? session?.walletAddress;

  const { isBuyRestricted, confirmPendingDeposit } = useAuth();
  const regionRestricted = Boolean(session && isBuyRestricted);

  const {
    switchDialogOpen,
    switchDialogVariant,
    switchLoading,
    onCancelSwitch,
    onConfirmSwitch,
    runWithTpPolygonGate,
  } = useTpPolygonSwitchGate();

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
    <>
      <section
        className={portfolioSummaryCardClass}
        aria-label={t("portfolioSummary")}
      >
        <div className="flex items-center gap-[20px]">
          {session ? (
            <WalletAvatar
              address={session.funderAddress ?? session.walletAddress}
              size="lg"
            />
          ) : (
            <div
              className="size-[52px] shrink-0 rounded-full border-4 border-prophet-panel bg-prophet-line shadow-[0_0_4px_rgba(0,0,0,0.25)]"
              aria-hidden="true"
            />
          )}
          {session ? (
            <div className="flex min-w-0 items-center gap-2">
              <span className={portfolioWalletAddressClass}>
                {formatShortWallet(polymarketAddress)}
              </span>
              <PolymarketAddressCopyButton
                address={polymarketAddress}
                ariaLabel={t("copyPolymarketAddress")}
                className="shrink-0 border-0 bg-transparent p-0 text-prophet-muted transition-colors hover:text-prophet-foreground"
              >
                <CopyIcon />
              </PolymarketAddressCopyButton>
              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 text-prophet-muted transition-colors hover:text-prophet-foreground disabled:opacity-50"
                aria-label={t("refreshPortfolioBalance")}
                disabled={refreshing}
                onClick={() => {
                  setRefreshing(true);
                  void reload().finally(() => setRefreshing(false));
                }}
              >
                <img
                  src="/icons/icon-refresh.svg"
                  alt=""
                  className={cn(
                    "size-3 object-contain",
                    refreshing && "animate-spin"
                  )}
                  aria-hidden
                />
              </button>
            </div>
          ) : (
            <span className="text-[20px] font-[500] leading-6 text-prophet-muted">
              {t("walletNotConnected")}
            </span>
          )}
          {confirmPendingDeposit.hasPendingDeposit ? (
            <RegionRestrictedControl restricted={regionRestricted}>
              <button
                type="button"
                className={cn(
                  depositPendingConfirmButtonClass,
                  "flex-grow-0 w-[230px] h-[42px] text-sm"
                )}
                disabled={
                  confirmPendingDeposit.converting ||
                  switchLoading ||
                  regionRestricted
                }
                onClick={() =>
                  void runWithTpPolygonGate(
                    () => confirmPendingDeposit.confirmPendingDeposit(),
                    "convert"
                  )
                }
              >
                {confirmPendingDeposit.converting ? (
                  <Loader2
                    className="mr-1.5 h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                {t("confirmPendingDeposit")}
              </button>
            </RegionRestrictedControl>
          ) : null}
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="w-full md:w-1/2 flex flex-col justify-between pt-[20px] md:h-[160px] relative">
            <div className="flex">
              <div className="w-1/2">
                <div className={portfolioSummaryLabelClass}>
                  {t("portfolio")}
                </div>
                <div className={portfolioSummaryValueLargeClass}>
                  ${portfolioDisplay}
                </div>
              </div>
              <div className="w-1/2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={portfolioSummaryLabelClass}>
                    {t("availableToTrade")}
                  </div>
                </div>
                <strong className={portfolioSummaryValueMediumClass}>
                  ${availableDisplay}
                </strong>
              </div>
            </div>
            <div className="flex gap-3 mt-[20px]">
              {!session ? (
                <button
                  type="button"
                  className={portfolioConnectButtonClass}
                  onClick={() => void onConnectWallet()}
                  disabled={status === "loading"}
                >
                  {status === "loading" ? t("connecting") : t("connectWallet")}
                </button>
              ) : (
                <>
                  <RegionRestrictedControl restricted={regionRestricted}>
                    <button
                      type="button"
                      className={cn(portfolioDepositButtonClass, "flex-1")}
                      disabled={regionRestricted}
                      onClick={() => openDepositDialog({ onSuccess: reload })}
                    >
                      {t("depositLabel")}
                    </button>
                  </RegionRestrictedControl>
                  <button
                    type="button"
                    className={cn(portfolioWithdrawButtonClass, "flex-1")}
                    onClick={() => setWithdrawOpen(true)}
                  >
                    {t("withdrawLabel")}
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
      <TpPolygonSwitchConfirmDialog
        open={switchDialogOpen}
        loading={switchLoading}
        variant={switchDialogVariant}
        onClose={onCancelSwitch}
        onConfirm={onConfirmSwitch}
      />
    </>
  );
}
