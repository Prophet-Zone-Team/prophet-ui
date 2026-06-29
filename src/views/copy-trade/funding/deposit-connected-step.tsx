"use client";

import { useTranslations } from "next-intl";

import type { FundingAsset } from "@/config/funding";
import { cn } from "@/lib/cn";
import { formatLongText } from "@/utils";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";

export interface DepositConnectedStepProps {
  token: FundingAsset;
  amount: string;
  toAddress: string;
  errorText?: string;
}

const rowClass = cn("flex items-center justify-between py-3");

export function DepositConnectedStep({
  token,
  amount,
  toAddress,
  errorText,
}: DepositConnectedStepProps) {
  const t = useTranslations("copyTrade.funding.deposit");

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex flex-col items-center gap-2 py-2">
        <TokenIcon symbol={token.symbol} icon={token.icon} />
        <span className="text-3xl font-[600] text-black">
          {amount} {token.symbol}
        </span>
      </div>

      <div className="flex flex-col divide-y divide-[#EBEBEB] rounded-[8px] border border-[#EBEBEB] px-4">
        <div className={rowClass}>
          <span className="text-sm text-[#909090]">{t("network")}</span>
          <span className="text-sm font-[500] text-black">
            {token.chainName}
          </span>
        </div>
        <div className={rowClass}>
          <span className="text-sm text-[#909090]">{t("token")}</span>
          <span className="text-sm font-[500] text-black">{token.symbol}</span>
        </div>
        <div className={rowClass}>
          <span className="text-sm text-[#909090]">{t("depositAddress")}</span>
          <span className="text-sm font-[500] text-black">
            {formatLongText(toAddress, 6, 4)}
          </span>
        </div>
      </div>

      <p className="text-xs leading-5 text-[#909090]">
        {t("connectedTransferDescription")}
      </p>

      {errorText ? (
        <span className="text-xs text-[#E5484D]">{errorText}</span>
      ) : null}
    </div>
  );
}
