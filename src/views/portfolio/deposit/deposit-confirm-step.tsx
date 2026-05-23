"use client";

import type { ReactNode } from "react";

import { formatShortWallet } from "@/lib/team/detail-format";
import {
  MOCK_TRANSACTION_BREAKDOWN
} from "@/views/portfolio/deposit/config";
import { depositDetailRowClass } from "@/views/portfolio/deposit/deposit-ui";
import { TransactionBreakdown } from "@/views/portfolio/deposit/transaction-breakdown";
import { TokenIcon, WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import { FundingAsset, POLYMARKET_USD } from "@/config/funding";
import { formatNumber } from "@/utils";

export interface DepositConfirmStepProps {
  walletAddress: string;
  token: FundingAsset;
  amount: string;
}

export function DepositConfirmStep({
  walletAddress,
  token,
  amount
}: DepositConfirmStepProps) {
  return (
    <div className="flex flex-col gap-4 pb-2">
      <p className="m-0 text-center text-[36px] font-[556] leading-[43px] text-black">
        {formatNumber(amount, token.decimals, true, { round: 0 })}
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
            <TokenIcon
              symbol="USDC"
              chainLabel={POLYMARKET_USD.chainName}
              icon={POLYMARKET_USD.icon}
              chainIcon={POLYMARKET_USD.chainIcon}
              size="sm"
            />
            <span>{formatShortWallet(walletAddress)}</span>
          </span>
        </DetailRow>
        <DetailRow label="Est. Time">
          <span>{MOCK_TRANSACTION_BREAKDOWN.estimatedTime}</span>
        </DetailRow>
        <DetailRow label="Send">
          <span className="flex items-center gap-2">
            <TokenIcon
              symbol={token.symbol}
              chainLabel={token.chainName}
              icon={token.icon}
              chainIcon={token.chainIcon}
              size="sm"
            />
            <span>{formatNumber(amount, 4, true, { round: 0 })}</span>
          </span>
        </DetailRow>
        <DetailRow label="Receive">
          <span className="flex items-center gap-2">
            <TokenIcon
              symbol="USDC"
              chainLabel={POLYMARKET_USD.chainName}
              icon={POLYMARKET_USD.icon}
              chainIcon={POLYMARKET_USD.chainIcon}
              size="sm"
            />
            <span>{formatNumber(amount, 4, true, { round: 0 })}</span>
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
      <span className="flex-1 border-t border-[#EBEBEB]/60"></span>
      <span className="font-[556] text-black">{children}</span>
    </div>
  );
}
