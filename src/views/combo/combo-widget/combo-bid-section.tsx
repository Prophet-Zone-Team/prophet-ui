import { cn } from "@/lib/cn";
import { formatTeamDetailMoney } from "@/lib/team/detail-format";
import { tradeQuickAmountClass } from "@/views/trade/trade-widget/trade-ui";

import { COMBO_QUICK_FRACTIONS } from "./constants";
import { formatComboBalanceLabel } from "./formatters";

export type ComboBidSectionProps = {
  bidAmount: number;
  balance: number;
  toWinAmount: number;
  showBidDetails?: boolean;
  isAuthenticated?: boolean;
  isSubmitting?: boolean;
  /** Initial quote load — disables Combo button and shows button loading label. */
  isQuoteLoading?: boolean;
  isSubmitDisabled?: boolean;
  loginInProgress?: boolean;
  connectWalletLabel?: string;
  connectingLabel?: string;
  submitLabel?: string;
  onBidAmountChange: (rawValue: string) => void;
  onApplyBalanceFraction: (fraction: number) => void;
  onSubmit?: () => void;
  onConnectWallet?: () => void;
};

export function ComboBidSection({
  bidAmount,
  balance,
  toWinAmount,
  showBidDetails = true,
  isAuthenticated = true,
  isSubmitting = false,
  isQuoteLoading = false,
  isSubmitDisabled = false,
  loginInProgress = false,
  connectWalletLabel = "Connect Wallet",
  connectingLabel = "Connecting…",
  submitLabel = "Combo",
  onBidAmountChange,
  onApplyBalanceFraction,
  onSubmit,
  onConnectWallet,
}: ComboBidSectionProps) {
  const actionLabel = !isAuthenticated
    ? loginInProgress
      ? connectingLabel
      : connectWalletLabel
    : isSubmitting
      ? "Submitting..."
      : isQuoteLoading
        ? "Loading..."
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

  return (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-4">
      {showBidDetails ? (
        <>
          <h2 className="m-0 text-base font-[500] leading-5 text-black">
            Bid Size
          </h2>

          <div className="flex h-[57px] items-center justify-between rounded-md border border-[#EBEBEB] bg-white px-4">
            <span className="text-sm font-[400] leading-[18px] text-black">
              Bid
            </span>
            <label className="flex items-baseline text-xl font-[500] leading-[25px] text-black">
              <span className="sr-only">Bid amount</span>
              <span aria-hidden="true">$</span>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={bidAmount > 0 ? bidAmount : ""}
                placeholder="0"
                onChange={(event) => onBidAmountChange(event.target.value)}
                style={{ fieldSizing: "content" }}
                className="border-0 bg-transparent p-0 text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-[400] leading-[18px] text-[#909090]">
              Bal. {formatComboBalanceLabel(balance)}
            </span>

            <div className="flex flex-wrap justify-end gap-1.5">
              {COMBO_QUICK_FRACTIONS.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  className={cn(
                    tradeQuickAmountClass,
                    "h-6 min-w-[42px] rounded-lg px-2 text-xs font-[400] leading-[15px] text-[#909090]"
                  )}
                  onClick={() => onApplyBalanceFraction(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-[500] leading-[18px] text-black">
              To Win
            </span>
            <span className="text-xl font-[500] leading-[25px] text-[#69C800]">
              {formatTeamDetailMoney(toWinAmount)}
            </span>
          </div>
        </>
      ) : null}

      <button
        type="button"
        disabled={actionDisabled}
        onClick={handleAction}
        className="flex h-[46px] w-full items-center justify-center rounded-lg bg-black text-base font-[500] leading-5 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {actionLabel}
      </button>
    </div>
  );
}
