import { formatTeamDetailMoney } from "@/lib/team/detail-format";

export type PositionCardModalActionsProps = {
  cashoutAmount?: number;
  isAuthenticated?: boolean;
  loginInProgress?: boolean;
  isQuoteLoading?: boolean;
  isSubmitting?: boolean;
  isCashoutDisabled?: boolean;
  connectWalletLabel?: string;
  connectingLabel?: string;
  onCashout?: () => void;
  onConnectWallet?: () => void;
};

export function PositionCardModalActions({
  cashoutAmount,
  isAuthenticated = true,
  loginInProgress = false,
  isQuoteLoading = false,
  isSubmitting = false,
  isCashoutDisabled = false,
  connectWalletLabel = "Connect Wallet",
  connectingLabel = "Connecting…",
  onCashout,
  onConnectWallet,
}: PositionCardModalActionsProps) {
  const cashoutLabel =
    !isAuthenticated
      ? loginInProgress
        ? connectingLabel
        : connectWalletLabel
      : isSubmitting
        ? "Submitting..."
        : isQuoteLoading
          ? "Loading..."
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
    <div className="flex gap-3 px-4 pb-4">
      <button
        type="button"
        disabled={cashoutDisabled}
        onClick={handleCashout}
        className="flex h-[46px] flex-1 items-center justify-center rounded-lg border border-[#EBEBEB] bg-white text-base font-[500] leading-5 text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {cashoutLabel}
      </button>

      <button
        type="button"
        disabled
        className="flex h-[46px] flex-1 items-center justify-center rounded-lg bg-black text-base font-[500] leading-5 text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        Share
      </button>
    </div>
  );
}
