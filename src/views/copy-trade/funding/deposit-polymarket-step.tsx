"use client";

import { useTranslations } from "next-intl";

import InputNumber from "@/components/input-number";
import { POLYMARKET_USD } from "@/config/funding";
import { COPY_TRADE_POLYMARKET_DEPOSIT_MIN_USD } from "@/hooks/copy-trade/use-copy-trade-polymarket-deposit";
import { formatShortWallet } from "@/lib/team/detail-format";
import { formatNumber } from "@/utils";
import {
  withdrawAmountInputClass,
  withdrawFieldLabelClass,
  withdrawInputBoxClass,
  withdrawMaxButtonClass,
} from "@/views/portfolio/withdraw/withdraw-ui";
import Big from "big.js";

export interface DepositPolymarketStepProps {
  funderAddress: string;
  balanceUsd: number;
  amount: string;
  onAmountChange: (amount: string) => void;
  errorText?: string;
}

export function DepositPolymarketStep({
  funderAddress,
  balanceUsd,
  amount,
  onAmountChange,
  errorText,
}: DepositPolymarketStepProps) {
  const t = useTranslations("copyTrade.funding.deposit");
  const tWithdraw = useTranslations("portfolio.withdraw");
  const tWallet = useTranslations("wallet");

  const balanceString = Big(balanceUsd || 0).toFixed(
    POLYMARKET_USD.decimals,
    Big.roundDown,
  );

  const handleAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-2">
      <div className="flex flex-col gap-1 rounded-[8px] border border-prophet-line bg-prophet-action-panel px-4 py-3">
        <span className="text-sm text-prophet-muted">{t("polymarketBalanceLabel")}</span>
        <span className="text-2xl font-[600] text-prophet-foreground">
          {formatNumber(balanceUsd, 2, true, { prefix: "$", round: 0 })}
        </span>
        <span className="text-xs text-prophet-muted">
          {formatShortWallet(funderAddress)}
        </span>
      </div>

      <p className="text-sm leading-5 text-prophet-muted">
        {t("polymarketTransferDescription")}
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={withdrawFieldLabelClass}>{tWithdraw("amount")}</span>
          <span className="text-xs text-prophet-muted">
            {tWallet("balance")}: {formatNumber(balanceString, 4, true, { round: 0 })}{" "}
            pUSD
          </span>
        </div>
        <div className={withdrawInputBoxClass}>
          <InputNumber
            className={withdrawAmountInputClass}
            decimals={POLYMARKET_USD.decimals}
            placeholder="0.00"
            value={amount}
            onNumberChange={handleAmountChange}
          />
          <button
            type="button"
            className={withdrawMaxButtonClass}
            onClick={() => onAmountChange(balanceString)}
          >
            {tWithdraw("max")}
          </button>
        </div>
        <span className="text-xs text-prophet-muted">
          {t("minimumDepositLabel", {
            amount: formatNumber(COPY_TRADE_POLYMARKET_DEPOSIT_MIN_USD, 2, true, {
              prefix: "$",
            }),
          })}
        </span>
        {errorText ? (
          <span className="text-xs text-[#FF674B]">{errorText}</span>
        ) : null}
      </div>
    </div>
  );
}
