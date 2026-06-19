"use client";

import { useTranslations } from "next-intl";

import { useAuth } from "@/context/auth";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/utils";

export interface PrivateBalanceProps {
  onClick?: () => void;
  className?: string;
}

function PrivateBalance({ onClick, className }: PrivateBalanceProps) {
  const t = useTranslations("wallet");
  const { privateBalance, confidentialAccount } = useAuth();

  const balanceDisplay =
    confidentialAccount.loading
      ? "$0.00"
      : formatNumber(privateBalance?.usd, 2, true, {
        prefix: "$",
        round: 0,
        isZeroPrecision: true,
        isLessPrecision: false,
      });

  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer text-[#909090] text-sm font-[400] px-2.5 rounded-lg border border-[#FFFFFF] h-[50px] flex flex-col items-end justify-center gap-0 transition-colors hover:border-[#EBEBEB]",
        className,
      )}
      onClick={onClick}
      aria-label={t("openPrivateTopup")}
    >
      <div className="flex items-center justify-center gap-1 leading-[17px]">
        <img
          src="/icons/icon-private.svg"
          alt=""
          className="shrink-0 w-4 h-3 object-center object-contain"
        />
        <div className="">{t("privateBalance")}</div>
      </div>
      <div className="text-black text-base leading-[19px]">{balanceDisplay}</div>
    </button>
  );
}

export default PrivateBalance;
