"use client";

import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { cn } from "@/lib/cn";
import {
  comboPrimaryButtonClass,
  comboSecondaryButtonClass
} from "@/views/combo/combo-ui";

export type PositionCardModalActionsProps = {
  cashoutAmount?: number;
  isAuthenticated?: boolean;
  loginInProgress?: boolean;
  isSubmitting?: boolean;
  isCashoutDisabled?: boolean;
  connectWalletLabel?: string;
  connectingLabel?: string;
  onCashout?: () => void;
  onConnectWallet?: () => void;
  onShare: () => void;
};

export function PositionCardModalActions({
  cashoutAmount,
  onShare,
  onCashout,
  isAuthenticated = true,
  loginInProgress = false,
  isSubmitting = false,
  isCashoutDisabled = false,
  connectWalletLabel = "Connect Wallet",
  connectingLabel = "Connecting…",
  onConnectWallet
}: PositionCardModalActionsProps) {
  const cashoutLabel = !isAuthenticated
    ? loginInProgress
      ? connectingLabel
      : connectWalletLabel
    : isSubmitting
      ? "Submitting..."
      : cashoutAmount != null && cashoutAmount > 0
        ? `Cashout ${formatTeamDetailMoney(cashoutAmount)}`
        : "Cashout";

  const cashoutDisabled = !isAuthenticated
    ? loginInProgress
    : isCashoutDisabled;

  const handleCashout = () => {
    if (!isAuthenticated) {
      onConnectWallet?.();
      return;
    }

    onCashout?.();
  };
  return (
    <div className="flex gap-3 px-3 pb-[calc(16px+env(safe-area-inset-bottom,0px))] sm:px-4 sm:pb-4">
      <button
        type="button"
        disabled={cashoutDisabled}
        onClick={handleCashout}
        className={cn(
          "flex h-[46px] flex-1 items-center justify-center rounded-lg text-base font-[500] leading-5 transition-opacity hover:opacity-90",
          comboSecondaryButtonClass
        )}
      >
        {cashoutLabel}
      </button>

      <button
        type="button"
        onClick={onShare}
        className={cn(
          "flex h-[46px] flex-1 items-center justify-center rounded-lg text-base font-[500] leading-5",
          comboPrimaryButtonClass
        )}
      >
        Share
      </button>
    </div>
  );
}
