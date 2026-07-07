"use client";

import { useTranslations } from "next-intl";

import { TeamFlag } from "@/components/teams/team-flag";
import { cn } from "@/lib/cn";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { ComboResponsiveOverlay } from "@/views/combo/combo-responsive-overlay";
import {
  comboMultiplierBadgeClass,
  comboMutedTextClass,
  comboPrimaryButtonClass,
  comboSkeletonClass,
  comboTitleTextClass
} from "@/views/combo/combo-ui";
import { ComboLogo } from "@/views/combo/combo-widget/combo-logo";
import {
  formatComboMultiplierLabel,
  formatComboPicksLabel
} from "@/views/combo/combo-widget/formatters";
import type { ComboPick } from "@/views/combo/combo-widget/types";
import { tradeQuickAmountClass } from "@/views/trade/trade-widget/trade-ui";

import {
  COMBO_MOBILE_QUICK_AMOUNTS,
  comboMobileBidSheetShellStyle
} from "./constants";
import { formatComboMobilePickSummary } from "./format-pick-summary";

export type ComboMobileBidSheetProps = {
  open: boolean;
  picks: ComboPick[];
  multiplier: number;
  bidAmount: number;
  balance: number;
  toWinAmount: number;
  isAuthenticated?: boolean;
  isSubmitting?: boolean;
  isQuoteLoading?: boolean;
  isSubmitDisabled?: boolean;
  loginInProgress?: boolean;
  connectWalletLabel?: string;
  connectingLabel?: string;
  submitLabel?: string;
  onClose: () => void;
  onBidAmountChange: (amount: number) => void;
  onConnectWallet?: () => void;
  onSubmit?: () => void;
};

export function ComboMobileBidSheet({
  open,
  picks,
  multiplier,
  bidAmount,
  balance,
  toWinAmount,
  isAuthenticated = true,
  isSubmitting = false,
  isQuoteLoading = false,
  isSubmitDisabled = false,
  loginInProgress = false,
  connectWalletLabel = "Connect Wallet",
  connectingLabel = "Connecting…",
  submitLabel = "Submit",
  onClose,
  onBidAmountChange,
  onConnectWallet,
  onSubmit
}: ComboMobileBidSheetProps) {
  const t = useTranslations("combo");

  const actionLabel = !isAuthenticated
    ? loginInProgress
      ? connectingLabel
      : connectWalletLabel
    : isSubmitting
      ? t("submittingCombo")
      : isQuoteLoading
        ? t("executableQuote")
        : submitLabel;

  const actionDisabled = !isAuthenticated
    ? loginInProgress
    : isSubmitDisabled;

  const handleAction = () => {
    if (!isAuthenticated) {
      onConnectWallet?.();
      return;
    }

    onSubmit?.();
  };

  const handleQuickAdd = (delta: number) => {
    onBidAmountChange(Math.max(0, bidAmount + delta));
  };

  const handleAllIn = () => {
    onBidAmountChange(balance);
  };

  const handleBidInputChange = (rawValue: string) => {
    const parsed = Number.parseFloat(rawValue);

    if (Number.isNaN(parsed) || parsed < 0) {
      onBidAmountChange(0);
      return;
    }

    onBidAmountChange(parsed);
  };

  return (
    <ComboResponsiveOverlay
      open={open}
      onClose={onClose}
      ariaLabel={t("title")}
      hideCloseButton
      className="max-w-none rounded-none border-0"
    >
      <div
        className="flex flex-col gap-5 px-5 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-5"
        style={comboMobileBidSheetShellStyle}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <ComboLogo />
            <span className="bg-[linear-gradient(270deg,#542099_0%,#8C35FF_100%)] bg-clip-text text-base font-[600] leading-5 text-transparent">
              {t("title")}
            </span>
            <span className={cn("text-base font-[500] leading-5", comboTitleTextClass)}>
              {formatComboPicksLabel(picks.length)}
            </span>
          </div>

          {isQuoteLoading ? (
            <span
              className={comboSkeletonClass}
              aria-label={t("executableQuote")}
            />
          ) : (
            <span className={comboMultiplierBadgeClass}>
              {formatComboMultiplierLabel(multiplier)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5">
            {picks.map((pick) => (
              <TeamFlag
                key={pick.id}
                code={pick.team.code}
                name={pick.team.name}
                logoUrl={pick.team.logoUrl}
                className="size-[25px] shrink-0 rounded-md border-2 border-prophet-panel drop-shadow-[0_0_2px_rgba(0,0,0,0.2)]"
              />
            ))}
          </div>
          <span className={cn("truncate text-sm font-[500] leading-[18px]", comboTitleTextClass)}>
            {formatComboMobilePickSummary(picks)}
          </span>
        </div>

        <div className="flex flex-col items-center gap-4">
          <label className={cn("flex items-baseline text-[36px] font-[500] leading-[45px]", comboTitleTextClass)}>
            <span className="sr-only">{t("bidAmount")}</span>
            <span aria-hidden="true">$</span>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={bidAmount > 0 ? bidAmount : ""}
              placeholder="0"
              onChange={(event) => handleBidInputChange(event.target.value)}
              className="w-[120px] border-0 bg-transparent p-0 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </label>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {COMBO_MOBILE_QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                className={cn(
                  tradeQuickAmountClass,
                  "h-[30px] min-w-[52px] px-3 text-sm font-[400] leading-[18px] text-prophet-muted"
                )}
                onClick={() => handleQuickAdd(amount)}
              >
                +{amount}
              </button>
            ))}
            <button
              type="button"
              className={cn(
                tradeQuickAmountClass,
                "h-[30px] min-w-[53px] px-3 text-sm font-[400] leading-[18px] text-prophet-muted"
              )}
              onClick={handleAllIn}
            >
              {t("allIn")}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className={cn("text-sm font-[500] leading-[18px]", comboTitleTextClass)}>
            {t("toWin")}
          </span>
          <span className="text-xl font-[500] leading-[25px] text-[#69C800]">
            {formatTeamDetailMoney(toWinAmount)}
          </span>
        </div>

        <button
          type="button"
          disabled={actionDisabled}
          onClick={handleAction}
          className={cn(
            "flex h-[46px] w-full items-center justify-center rounded-xl text-base font-[500] leading-5",
            comboPrimaryButtonClass
          )}
        >
          {actionLabel}
        </button>
      </div>
    </ComboResponsiveOverlay>
  );
}
