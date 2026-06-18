"use client";

import { formatTeamDetailMoney } from "@/lib/team/detail-format";

export type PositionCardModalActionsProps = {
  cashoutAmount?: number;
  onShare: () => void;
  onCashout: () => void;
};

export function PositionCardModalActions({
  cashoutAmount,
  onShare,
  onCashout,
}: PositionCardModalActionsProps) {
  const cashoutLabel =
    cashoutAmount != null && cashoutAmount > 0
      ? `Cashout ${formatTeamDetailMoney(cashoutAmount)}`
      : "Cashout";

  const handleCashout = () => {
    // TODO: execute combo cashout business logic
    onCashout();
  };

  return (
    <div className="flex gap-3 px-4 pb-4">
      <button
        type="button"
        onClick={handleCashout}
        className="flex h-[46px] flex-1 items-center justify-center rounded-lg border border-[#EBEBEB] bg-white text-base font-[500] leading-5 text-black transition-opacity hover:opacity-90"
      >
        {cashoutLabel}
      </button>

      <button
        type="button"
        onClick={onShare}
        className="flex h-[46px] flex-1 items-center justify-center rounded-lg bg-black text-base font-[500] leading-5 text-white transition-opacity hover:opacity-90"
      >
        Share
      </button>
    </div>
  );
}
