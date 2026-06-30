"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatStrategyBudgetLabel } from "@/lib/strategy/strategy-metrics";
import type { StrategyBidLeg } from "@/lib/strategy/strategy-bid-validation";

import { STRATEGY_BID_SIGN_MODAL_WIDTH } from "../constants";
import { StrategyBidModalShell } from "../strategy-bid-modal-shell";
import { StrategyBidResponsiveOverlay } from "../strategy-bid-responsive-overlay";
import { SignLegRow } from "./sign-leg-row";
import { useStrategyBidSign } from "./use-strategy-bid-sign";

export type StrategyBidSignModalProps = {
  open: boolean;
  onClose: () => void;
  strategyName: string;
  bidAmount: number;
  estimatedRoiLabel: string;
  hitReturnLabel: string;
  legs: StrategyBidLeg[];
  onComplete: () => void;
};

export function StrategyBidSignModal({
  open,
  onClose,
  strategyName,
  bidAmount,
  estimatedRoiLabel,
  hitReturnLabel,
  legs,
  onComplete
}: StrategyBidSignModalProps) {
  const t = useTranslations("strategy");
  const {
    legStates,
    isSubmitting,
    submitError,
    canSubmitOrders,
    signLeg,
    signAgain,
    submitOrders
  } = useStrategyBidSign({
    open,
    legs,
    strategyName,
    bidAmount,
    estimatedRoiLabel,
    hitReturnLabel,
    onComplete
  });

  if (!open || legs.length === 0) {
    return null;
  }

  return (
    <StrategyBidResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={t("joinStrategySigning")}
      className={STRATEGY_BID_SIGN_MODAL_WIDTH}
      hideCloseButton
    >
      <StrategyBidModalShell
        onClose={onClose}
        footer={
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={!canSubmitOrders}
              onClick={() => void submitOrders()}
              className={cn(
                "flex h-[50px] w-full items-center justify-center rounded-xl bg-[#65AF14]",
                "font-[Sora] text-sm font-normal leading-[18px] text-white",
                "transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              )}
            >
              {isSubmitting ? t("submitting") : t("submitOrders")}
            </button>
            {submitError ? (
              <p className="m-0 text-center text-sm text-[#FF674B]">{submitError}</p>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          <div className="flex items-center justify-between">
            <span className="font-[Sora] text-sm font-normal leading-[18px] text-prophet-foreground">
              {t("totalBidValue")}
            </span>
            <span className="font-[Sora] text-sm font-medium leading-[18px] text-prophet-foreground">
              {formatStrategyBudgetLabel(bidAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-[Sora] text-sm font-normal leading-[18px] text-prophet-muted">
              {t("tableMarket")}
            </span>
            <span className="font-[Sora] text-sm font-normal leading-[18px] text-prophet-muted">
              {t("valued")}
            </span>
          </div>

          <div className="flex flex-col">
            {legStates.map((entry, index) => (
              <SignLegRow
                key={entry.leg.id}
                entry={entry}
                isLast={index === legStates.length - 1}
                onSign={(legId) => void signLeg(legId)}
                onSignAgain={signAgain}
              />
            ))}
          </div>
        </div>
      </StrategyBidModalShell>
    </StrategyBidResponsiveOverlay>
  );
}
