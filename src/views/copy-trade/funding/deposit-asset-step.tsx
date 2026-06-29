"use client";

import { useState } from "react";

import type { FundingAsset } from "@/config/funding";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/utils";
import type { CopyDepositChainOption } from "@/lib/copy-trade/deposit-assets";
import { FundingSelectorDropdown } from "@/views/portfolio/shared/funding-selector-dropdown";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";
import {
  withdrawAmountInputClass,
  withdrawFieldLabelClass,
  withdrawInputBoxClass,
  withdrawMaxButtonClass,
} from "@/views/portfolio/withdraw/withdraw-ui";

export interface DepositAssetStepProps {
  totalBalanceUsd: number;
  chainOptions: CopyDepositChainOption[];
  tokensForChain: FundingAsset[];
  selectedChain: CopyDepositChainOption | null;
  selectedToken: FundingAsset | null;
  amount: string;
  balancesLoading: boolean;
  assetsLoading: boolean;
  resolveTokenBalance: (token: FundingAsset) => string;
  onChainChange: (chain: CopyDepositChainOption) => void;
  onTokenChange: (token: FundingAsset) => void;
  onAmountChange: (amount: string) => void;
  errorText?: string;
}

const tokenRowClass = cn(
  "flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[#FAFBFC]",
);

export function DepositAssetStep({
  totalBalanceUsd,
  chainOptions,
  tokensForChain,
  selectedChain,
  selectedToken,
  amount,
  balancesLoading,
  assetsLoading,
  resolveTokenBalance,
  onChainChange,
  onTokenChange,
  onAmountChange,
  errorText,
}: DepositAssetStepProps) {
  const [chainOpen, setChainOpen] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);

  const selectedBalance = selectedToken
    ? resolveTokenBalance(selectedToken)
    : "0";

  const handleAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      onAmountChange(value);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-2">
      <div className="flex flex-col gap-1 rounded-[8px] border border-[#EBEBEB] bg-[#FAFBFC] px-4 py-3">
        <span className="text-sm text-[#909090]">Wallet balance (deposit-able)</span>
        <span className="text-2xl font-[600] text-black">
          {formatNumber(totalBalanceUsd, 2, true, { prefix: "$", round: 0 })}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FundingSelectorDropdown
          dropdownClassName="max-h-[160px]"
          label="Network"
          triggerLabel={
            selectedChain?.chainName ??
            (assetsLoading ? "Loading…" : "Select network")
          }
          disabled={assetsLoading || chainOptions.length === 0}
          open={chainOpen}
          onOpenChange={(next) => {
            setChainOpen(next);
            if (next) {
              setTokenOpen(false);
            }
          }}
          triggerIcon={
            selectedChain ? (
              <TokenIcon
                symbol="token"
                chainLabel={selectedChain.chainName}
                chainIcon={selectedChain.chainIcon}
                size="sm"
                chainOnly
              />
            ) : null
          }
        >
          {chainOptions.map((chain) => {
            const isSelected = selectedChain?.chainId === chain.chainId;
            return (
              <button
                key={chain.chainId}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(tokenRowClass, isSelected && "bg-[#F4F6FF]")}
                onClick={() => {
                  onChainChange(chain);
                  setChainOpen(false);
                }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <TokenIcon
                    symbol="token"
                    chainLabel={chain.chainName}
                    chainIcon={chain.chainIcon}
                    size="sm"
                    chainOnly
                  />
                  <span className="text-sm font-[500] text-black">
                    {chain.chainName}
                  </span>
                </span>
              </button>
            );
          })}
        </FundingSelectorDropdown>

        <FundingSelectorDropdown
          dropdownClassName="max-h-[160px]"
          label="Token"
          triggerLabel={
            selectedToken?.symbol ??
            (assetsLoading ? "Loading…" : "Select token")
          }
          disabled={assetsLoading || tokensForChain.length === 0}
          open={tokenOpen}
          onOpenChange={(next) => {
            setTokenOpen(next);
            if (next) {
              setChainOpen(false);
            }
          }}
          triggerIcon={
            selectedToken ? (
              <TokenIcon
                symbol={selectedToken.symbol}
                icon={selectedToken.icon}
                size="sm"
              />
            ) : null
          }
        >
          {tokensForChain.map((token) => {
            const isSelected =
              selectedToken?.chainId === token.chainId &&
              selectedToken?.address === token.address;

            return (
              <button
                key={`${token.chainId}-${token.address}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={cn(tokenRowClass, isSelected && "bg-[#F4F6FF]")}
                onClick={() => {
                  onTokenChange(token);
                  setTokenOpen(false);
                }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <TokenIcon
                    symbol={token.symbol}
                    icon={token.icon}
                    size="sm"
                  />
                  <span className="text-sm font-[500] text-black">
                    {token.symbol}
                  </span>
                </span>
                <span className="text-xs text-[#909090]">
                  {formatNumber(resolveTokenBalance(token), 4, true, { round: 0 })}
                </span>
              </button>
            );
          })}
        </FundingSelectorDropdown>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={withdrawFieldLabelClass}>Amount</span>
          <span className="text-xs text-[#909090]">
            Balance: {formatNumber(selectedBalance, 4, true, { round: 0 })}{" "}
            {selectedToken?.symbol ?? ""}
          </span>
        </div>
        <div className={withdrawInputBoxClass}>
          <input
            className={withdrawAmountInputClass}
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => handleAmountChange(event.target.value)}
            disabled={!selectedToken}
          />
          <button
            type="button"
            className={withdrawMaxButtonClass}
            disabled={!selectedToken}
            onClick={() => onAmountChange(selectedBalance)}
          >
            Max
          </button>
        </div>
        {selectedToken ? (
          <span className="text-xs text-[#909090]">
            Minimum deposit: ${formatNumber(selectedToken.minCheckoutUsd, 2, true)}
          </span>
        ) : null}
        {errorText ? (
          <span className="text-xs text-[#E5484D]">{errorText}</span>
        ) : null}
      </div>
    </div>
  );
}
