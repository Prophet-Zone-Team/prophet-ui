"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatShortWallet } from "@/lib/team/detail-format";
import { formatNumber } from "@/utils";
import { WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import {
  depositConnectedRowClass,
  depositConnectedRowHighlightedClass,
  depositSectionLabelClass,
} from "@/views/portfolio/deposit/deposit-ui";

export interface DepositMethodEntryProps {
  funderAddress: string;
  balanceUsd: number;
  onSelectPolymarket: () => void;
}

export function DepositMethodEntry({
  funderAddress,
  balanceUsd,
  onSelectPolymarket,
}: DepositMethodEntryProps) {
  const t = useTranslations("copyTrade.funding.deposit");

  return (
    <div className="flex flex-col gap-2">
      <span className={depositSectionLabelClass}>{t("polymarketDepositTitle")}</span>
      <button
        type="button"
        className={cn(depositConnectedRowHighlightedClass, "w-full")}
        onClick={onSelectPolymarket}
      >
        <span className="flex min-w-0 items-center gap-3">
          <WalletAvatarIcon address={funderAddress} />
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            <span className="truncate text-base font-[500] text-prophet-foreground">
              {formatShortWallet(funderAddress)}
            </span>
            <span className="text-xs text-prophet-muted">
              {t("polymarketDepositDescription")}
            </span>
          </span>
        </span>
        <span className="shrink-0 text-base font-[500] text-prophet-foreground">
          {formatNumber(balanceUsd, 2, true, { prefix: "$", round: 0 })}
        </span>
      </button>
      <span className={depositSectionLabelClass}>{t("walletDepositTitle")}</span>
    </div>
  );
}

export interface DepositMethodBackRowProps {
  funderAddress: string;
  onBack: () => void;
}

export function DepositMethodBackRow({
  funderAddress,
  onBack,
}: DepositMethodBackRowProps) {
  const t = useTranslations("copyTrade.funding.deposit");

  return (
    <button
      type="button"
      className={cn(depositConnectedRowClass, "w-full")}
      onClick={onBack}
    >
      <span className="flex min-w-0 items-center gap-3">
        <WalletAvatarIcon address={funderAddress} />
        <span className="truncate text-sm font-[500] text-prophet-foreground">
          {formatShortWallet(funderAddress)}
        </span>
      </span>
      <span className="shrink-0 text-sm font-[500] text-[#3168FF]">
        {t("backToWalletDeposit")}
      </span>
    </button>
  );
}
