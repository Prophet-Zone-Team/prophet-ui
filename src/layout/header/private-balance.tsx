"use client";

import { Loader2 } from "lucide-react";

import { usePrivateBalances } from "@/hooks/confidential/use-private-balances";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/utils";

function PrivateBalance(props: {
  onClick?: () => void;
  className?: string;
}) {
  const { onClick, className } = props;
  const { privateBalanceUsd, loading } = usePrivateBalances({ auto: true });

  const formattedBalance = formatNumber(privateBalanceUsd, 2, true, {
    prefix: "$",
    round: 0,
    isZeroPrecision: true,
  });

  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer text-[#909090] text-sm font-[400] px-2.5 rounded-lg border border-[#EBEBEB] h-[50px] flex flex-col items-end justify-center gap-0 transition-colors hover:border-[#d0d0d0]",
        className,
      )}
      onClick={onClick}
      aria-label="Open Private Topup"
    >
      <div className="flex items-center justify-center gap-1 leading-[17px]">
        <img
          src="/icons/icon-private.svg"
          alt=""
          className="shrink-0 w-4 h-3 object-center object-contain"
        />
        <div className="">Private Balance</div>
      </div>
      <div className="flex items-center gap-1 text-black text-base leading-[19px]">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#909090]" aria-hidden />
        ) : (
          formattedBalance
        )}
      </div>
    </button>
  );
}

export default PrivateBalance;
