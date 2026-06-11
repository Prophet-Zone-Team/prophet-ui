"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { TradeAuthActionButton } from "@/components/trading/trade-auth-action-button";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/context/auth";
import { useLocalizedStrategyLabels } from "@/hooks/i18n/use-localized-strategy-labels";
import { cn } from "@/lib/cn";
import { getStrategyBidSignableLegs } from "@/lib/strategy/strategy-bid-validation";
import { trackOrderTicketOpened } from "@/lib/analytics/tracking";
import { ensureTradingReadyForBid } from "@/views/trade/trade-widget/trade-ticket-helpers";

import { BidValueSection } from "./bid-value-section";
import { STRATEGY_BID_MODAL_WIDTH } from "./constants";
import { MarketBreakdownTable } from "./market-breakdown-table";
import { RiskDisclaimer } from "./risk-disclaimer";
import { StrategyBidSignModal } from "./sign-modal";
import { StrategyBidModalShell } from "./strategy-bid-modal-shell";
import { StrategySummary } from "./strategy-summary";
import type { StrategyBidModalProps, StrategyBidStep } from "./types";
import { useStrategyBidForm } from "./use-strategy-bid-form";

export type { StrategyBidModalProps } from "./types";

export function StrategyBidModal({
  open,
  onClose,
  strategy,
  snapshots
}: StrategyBidModalProps) {
  const t = useTranslations("strategy");
  const tAuth = useTranslations("auth");
  const auth = useAuth();
  const [step, setStep] = useState<StrategyBidStep>("confirm");
  const [message, setMessage] = useState<string | undefined>();
  const [isProceeding, setIsProceeding] = useState(false);

  const {
    bidAmount,
    bidAmountInput,
    balanceLabel,
    preview,
    validation,
    riskAccepted,
    canProceedToSign,
    insufficientFunds,
    skipPreValidation,
    aggregateError,
    minBidLabel,
    setRiskAccepted,
    handleBidAmountChange,
    applyBalanceFraction,
    applyMinBidAmount
  } = useStrategyBidForm(open, strategy, snapshots);

  const { name: localizedStrategyName } = useLocalizedStrategyLabels(
    strategy?.id ?? "",
    {
      name: strategy?.name ?? "",
      description: strategy?.description ?? ""
    }
  );

  useEffect(() => {
    if (!open) {
      setStep("confirm");
      setMessage(undefined);
      setIsProceeding(false);
      return;
    }

    trackOrderTicketOpened({
      entrySource: "strategy_bid_modal"
    });
  }, [open]);

  const handleClose = useCallback(() => {
    setStep("confirm");
    setMessage(undefined);
    onClose();
  }, [onClose]);

  const handleProceedToSign = useCallback(async () => {
    if (!canProceedToSign || !validation) {
      return;
    }

    setMessage(undefined);
    setIsProceeding(true);

    try {
      const gate = await ensureTradingReadyForBid({
        session: auth.session,
        authReadiness: auth.readiness,
        orderReadiness: auth.readiness,
        previewCanSubmit: true,
        tradeSide: "buy",
        isBuyRestricted: auth.isBuyRestricted,
        isRegionFullyBlocked: auth.isRegionBlocked,
        openLogin: auth.openLogin,
        signClobCredentials: auth.signClobCredentials,
        signTokenApprovals: auth.signTokenApprovals,
        refreshSetupReadiness: auth.refreshSetupReadiness
      });

      if (!gate.ok) {
        setMessage(gate.message);
        return;
      }

      setStep("sign");
    } finally {
      setIsProceeding(false);
    }
  }, [auth, canProceedToSign, validation]);

  if (!strategy || !preview || !validation) {
    return null;
  }

  return (
    <>
      <Modal
        open={open && step === "confirm"}
        onClose={handleClose}
        ariaLabel={t("joinStrategy")}
        className={STRATEGY_BID_MODAL_WIDTH}
        hideCloseButton
      >
        <StrategyBidModalShell
          onClose={handleClose}
          footer={
            <div className="flex flex-col gap-2">
              <TradeAuthActionButton
                className={cn(
                  "flex h-[50px] w-full items-center justify-center rounded-lg",
                  "bg-[#65AF14] font-[Sora] text-base font-normal leading-5 text-white",
                  "transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                )}
                actionLabel={t("bidNow")}
                connectLabel={tAuth("enableTrading")}
                canSubmit={canProceedToSign && !isProceeding}
                actionStatus={isProceeding ? "submitting" : undefined}
                submittingLabel={t("checking")}
                onAction={handleProceedToSign}
                onLoginStart={() => setMessage(undefined)}
                onLoginSuccess={() => setMessage(undefined)}
                onLoginError={(error) => setMessage(error.message)}
              />
              {message ? (
                <p className="m-0 text-center text-sm text-[#FF674B]">
                  {message}
                </p>
              ) : null}
            </div>
          }
        >
          <div className="flex flex-col gap-6 pb-2">
            {skipPreValidation ? (
              <p className="m-0 rounded-lg border border-[#EBEBEB] bg-[#F7F7F7] px-3 py-2 text-center text-xs leading-[16px] text-[#909090]">
                {t("testModeSkipPreValidation")}
              </p>
            ) : null}

            <StrategySummary
              name={localizedStrategyName}
              estimatedRoiLabel={preview.estimatedRoiLabel}
              teams={strategy.teamRefs}
            />

            <BidValueSection
              bidAmountInput={bidAmountInput}
              balanceLabel={balanceLabel}
              minBidLabel={minBidLabel}
              insufficientFunds={insufficientFunds}
              aggregateError={aggregateError}
              onBidAmountChange={handleBidAmountChange}
              onApplyBalanceFraction={applyBalanceFraction}
              onApplyMinBidAmount={applyMinBidAmount}
            />

            <MarketBreakdownTable
              rows={preview.marketRows}
              toWinLabel={preview.toWinLabel}
            />

            <RiskDisclaimer
              checked={riskAccepted}
              onCheckedChange={setRiskAccepted}
            />
          </div>
        </StrategyBidModalShell>
      </Modal>

      <StrategyBidSignModal
        open={open && step === "sign"}
        onClose={handleClose}
        strategyName={localizedStrategyName}
        bidAmount={bidAmount}
        estimatedRoiLabel={preview.estimatedRoiLabel}
        hitReturnLabel={preview.toWinLabel}
        legs={getStrategyBidSignableLegs(validation.legs, {
          skipPreValidation
        })}
        onComplete={handleClose}
      />
    </>
  );
}
