"use client";

import type { ReactNode } from "react";

import { formatPortfolioMoney } from "@/lib/portfolio/portfolio-format";
import { formatShortWallet } from "@/lib/team/detail-format";
import {
  DEPOSIT_RECEIVE_ASSET,
  MOCK_TRANSACTION_BREAKDOWN
} from "@/views/portfolio/deposit/config";
import { depositDetailRowClass } from "@/views/portfolio/deposit/deposit-ui";
import { TransactionBreakdown } from "@/views/portfolio/deposit/transaction-breakdown";
import type { DepositTokenOption } from "@/views/portfolio/deposit/types";
import { formatAmountInputValue } from "@/views/portfolio/deposit/utils";
import { TokenIcon, WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";

export interface DepositConfirmStepProps {
  walletAddress: string;
  token: DepositTokenOption;
  amount: number;
}

export function DepositConfirmStep({
  walletAddress,
  token,
  amount
}: DepositConfirmStepProps) {
  const displayAmount = formatAmountInputValue(amount);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <p className="m-0 text-center text-[36px] font-[556] leading-[43px] text-black">
        {formatPortfolioMoney(amount)}
      </p>

      <div className="flex flex-col">
        <DetailRow label="From">
          <span className="flex items-center gap-2">
            <WalletAvatarIcon />
            <span>{formatShortWallet(walletAddress)}</span>
          </span>
        </DetailRow>
        <DetailRow label="To">
          <span className="flex items-center gap-2">
            <TokenIcon symbol="USDC" chainLabel={DEPOSIT_RECEIVE_ASSET.chainLabel} size="sm" />
            <span>{formatShortWallet(walletAddress)}</span>
          </span>
        </DetailRow>
        <DetailRow label="Est. Time">
          <span>{MOCK_TRANSACTION_BREAKDOWN.estimatedTime}</span>
        </DetailRow>
        <DetailRow label="Send">
          <span className="flex items-center gap-2">
            <TokenIcon symbol={token.symbol} chainLabel={token.chainLabel} size="sm" />
            <span>{displayAmount}</span>
          </span>
        </DetailRow>
        <DetailRow label="Receive">
          <span className="flex items-center gap-2">
            <TokenIcon symbol="USDC" chainLabel={DEPOSIT_RECEIVE_ASSET.chainLabel} size="sm" />
            <span>{displayAmount}</span>
          </span>
        </DetailRow>
      </div>

      <TransactionBreakdown />
    </div>
  );
}

function DetailRow({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={depositDetailRowClass}>
      <span className="text-[#909090]">{label}</span>
      <span className="font-[556] text-black">{children}</span>
    </div>
  );
}
