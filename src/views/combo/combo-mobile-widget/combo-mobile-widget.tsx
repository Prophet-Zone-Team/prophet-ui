"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import {
  comboMultiplierBadgeClass,
  comboMutedTextClass,
  comboPrimaryButtonClass,
  comboSkeletonClass,
  comboTitleTextClass
} from "@/views/combo/combo-ui";
import { ComboLogo } from "@/views/combo/combo-widget/combo-logo";
import { MIN_COMBO_PICKS } from "@/views/combo/combo-widget/constants";
import {
  formatComboMultiplierLabel,
  formatComboPicksLabel
} from "@/views/combo/combo-widget/formatters";
import type { ComboPick } from "@/views/combo/combo-widget/types";

import { ComboMobileBidSheet } from "./combo-mobile-bid-sheet";
import { ComboMobilePickRow } from "./combo-mobile-pick-row";
import {
  COMBO_MOBILE_WIDGET_BOTTOM_OFFSET_PX,
  COMBO_MOBILE_WIDGET_HORIZONTAL_PADDING_PX,
  comboMobileWidgetShellStyle
} from "./constants";

export type ComboMobileWidgetProps = {
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
  onBidAmountChange: (amount: number) => void;
  onRemovePick?: (pickId: string) => void;
  onConnectWallet?: () => void;
  onSubmit?: () => void;
};

export function ComboMobileWidget({
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
  connectWalletLabel,
  connectingLabel,
  submitLabel,
  onBidAmountChange,
  onRemovePick,
  onConnectWallet,
  onSubmit
}: ComboMobileWidgetProps) {
  const t = useTranslations("combo");
  const [bidSheetOpen, setBidSheetOpen] = useState(false);
  const hasMinimumPicks = picks.length >= MIN_COMBO_PICKS;
  const showPicks = picks.length > 0;

  useEffect(() => {
    if (!hasMinimumPicks) {
      setBidSheetOpen(false);
    }
  }, [hasMinimumPicks]);

  const handleComboAction = () => {
    if (!hasMinimumPicks) {
      return;
    }

    if (!isAuthenticated) {
      onConnectWallet?.();
      return;
    }

    setBidSheetOpen(true);
  };

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 z-40 lg:hidden"
        style={{
          bottom: `calc(${COMBO_MOBILE_WIDGET_BOTTOM_OFFSET_PX}px + env(safe-area-inset-bottom, 0px))`,
          paddingLeft: COMBO_MOBILE_WIDGET_HORIZONTAL_PADDING_PX,
          paddingRight: COMBO_MOBILE_WIDGET_HORIZONTAL_PADDING_PX
        }}
      >
        <div
          className="pointer-events-auto mx-auto w-full max-w-[370px] rounded-2xl border border-prophet-line shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_10px_rgba(0,0,0,0.35)]"
          style={comboMobileWidgetShellStyle}
        >
          <div className="flex flex-col gap-2.5 p-2.5">
            <div className="flex items-center justify-between gap-2 px-1.5 pt-0.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <ComboLogo />
                <span className="bg-[linear-gradient(270deg,#542099_0%,#8C35FF_100%)] bg-clip-text text-base font-[600] leading-5 text-transparent">
                  {t("title")}
                </span>
                {showPicks ? (
                  <span className={cn("truncate text-base font-[500] leading-5", comboTitleTextClass)}>
                    {formatComboPicksLabel(picks.length)}
                  </span>
                ) : (
                  <span className={cn("truncate text-xs font-[400] leading-[15px]", comboMutedTextClass)}>
                    {t("selectMinPicksHint")}
                  </span>
                )}
              </div>

              {showPicks && hasMinimumPicks ? (
                isQuoteLoading ? (
                  <span
                    className={comboSkeletonClass}
                    aria-label={t("executableQuote")}
                  />
                ) : (
                  <span className={comboMultiplierBadgeClass}>
                    {formatComboMultiplierLabel(multiplier)}
                  </span>
                )
              ) : null}
            </div>

            {showPicks ? (
              <div className="flex max-h-[162px] flex-col gap-2 overflow-y-auto">
                {picks.map((pick) => (
                  <ComboMobilePickRow
                    key={pick.id}
                    pick={pick}
                    onRemove={() => onRemovePick?.(pick.id)}
                  />
                ))}
              </div>
            ) : null}

            <button
              type="button"
              disabled={!hasMinimumPicks}
              onClick={handleComboAction}
              className={cn(
                "flex h-[46px] w-full items-center justify-center rounded-xl text-base font-[400] leading-5 text-white transition-opacity",
                hasMinimumPicks
                  ? comboPrimaryButtonClass
                  : "cursor-not-allowed bg-black/30 dark:bg-prophet-primary/30"
              )}
            >
              {t("submitCombo")}
            </button>
          </div>
        </div>
      </div>

      <ComboMobileBidSheet
        open={bidSheetOpen}
        picks={picks}
        multiplier={multiplier}
        bidAmount={bidAmount}
        balance={balance}
        toWinAmount={toWinAmount}
        isAuthenticated={isAuthenticated}
        isSubmitting={isSubmitting}
        isQuoteLoading={isQuoteLoading}
        isSubmitDisabled={isSubmitDisabled}
        loginInProgress={loginInProgress}
        connectWalletLabel={connectWalletLabel}
        connectingLabel={connectingLabel}
        submitLabel={t("submit")}
        onClose={() => setBidSheetOpen(false)}
        onBidAmountChange={onBidAmountChange}
        onConnectWallet={onConnectWallet}
        onSubmit={() => {
          onSubmit?.();
        }}
      />
    </>
  );
}
