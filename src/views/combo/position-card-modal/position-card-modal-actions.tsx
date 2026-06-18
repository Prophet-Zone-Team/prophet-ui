import { formatTeamDetailMoney } from "@/lib/team/detail-format";

export type PositionCardModalActionsProps = {
  cashoutAmount?: number;
};

export function PositionCardModalActions({
  cashoutAmount
}: PositionCardModalActionsProps) {
  const cashoutLabel =
    cashoutAmount != null && cashoutAmount > 0
      ? `Cashout ${formatTeamDetailMoney(cashoutAmount)}`
      : "Cashout";

  return (
    <div className="flex gap-3 px-4 pb-4">
      <button
        type="button"
        disabled
        className="flex h-[46px] flex-1 items-center justify-center rounded-lg border border-[#EBEBEB] bg-white text-base font-[500] leading-5 text-black disabled:cursor-not-allowed disabled:opacity-70"
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
