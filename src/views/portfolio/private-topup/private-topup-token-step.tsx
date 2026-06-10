"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatNumber } from "@/utils";
import {
  depositTokenRowClass,
  depositTokenRowSelectedClass,
} from "@/views/portfolio/deposit/deposit-ui";
import { TokenIcon, WalletAvatarIcon } from "@/views/portfolio/shared/token-icon";
import { formatShortWallet } from "@/lib/team/detail-format";
import {
  privateTopupChangeLinkClass,
  privateTopupFundingWalletRowClass,
  privateTopupSectionLabelClass,
} from "@/views/portfolio/private-topup/private-topup-ui";
import { usePrivateTopupContext } from "@/views/portfolio/private-topup/context";
import type { PrivateTopupSelectableToken } from "@/views/portfolio/private-topup/types";

export interface PrivateTopupTokenStepProps {
  selectedToken?: PrivateTopupSelectableToken;
  onSelectToken: (token: PrivateTopupSelectableToken) => void;
  onChangeWallet: () => void;
}

export function PrivateTopupTokenStep({
  selectedToken,
  onSelectToken,
  onChangeWallet,
}: PrivateTopupTokenStepProps) {
  const {
    selectableTokens,
    topupWalletAddress,
    getTokenBalance,
    getTokenUsdValue,
    hasTokenUsdPrice,
    balancesLoading,
    pricesLoading,
    topupWalletBalanceUsd,
  } = usePrivateTopupContext();

  const sortedTokens = useMemo(() => {
    return selectableTokens
      .map((asset) => {
        const balance = getTokenBalance(asset);
        const usdValue = getTokenUsdValue(asset);

        return {
          ...asset,
          balance,
          usdValue,
        };
      })
      .sort((a, b) => b.usdValue - a.usdValue);
  }, [getTokenBalance, getTokenUsdValue, selectableTokens]);

  const loading = balancesLoading || pricesLoading;

  return (
    <div className="flex flex-col gap-5 pb-2">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={privateTopupSectionLabelClass}>Funding Wallet</span>
          <button
            type="button"
            className={privateTopupChangeLinkClass}
            onClick={onChangeWallet}
          >
            Change
          </button>
        </div>
        <div className={privateTopupFundingWalletRowClass}>
          <span className="flex min-w-0 items-center gap-2">
            <WalletAvatarIcon address={topupWalletAddress} className="size-5" />
            <span className="text-base font-[500] text-black">
              {topupWalletAddress
                ? formatShortWallet(topupWalletAddress)
                : "--"}
            </span>
          </span>
          <span className="shrink-0 text-base font-[500] text-black">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              formatNumber(topupWalletBalanceUsd, 2, true, {
                prefix: "$",
                round: 0,
                isZeroPrecision: true
              })
            )}
          </span>
        </div>
      </div>

      <div>
        <p className={`m-0 mb-2 ${privateTopupSectionLabelClass}`}>
          Select Asset
        </p>
        <div className="flex max-h-[340px] flex-col gap-0.5 overflow-y-auto">
          {sortedTokens.map((token) => {
            const isSelected =
              selectedToken?.chainId === token.chainId &&
              selectedToken?.address === token.address;
            const usdDisplay =
              token.usdValue > 0 || hasTokenUsdPrice(token.symbol)
                ? formatNumber(token.usdValue, 2, true, {
                    prefix: "$",
                    round: 0,
                    isZeroPrecision: true
                  })
                : "--";

            return (
              <button
                key={`${token.chainId}-${token.address}`}
                type="button"
                className={cn(
                  depositTokenRowClass,
                  isSelected && depositTokenRowSelectedClass
                )}
                onClick={() => onSelectToken(token)}
              >
                <TokenIcon
                  symbol={token.symbol}
                  chainLabel={token.chainName}
                  icon={token.icon}
                  chainIcon={token.chainIcon}
                />
                <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  <span className="text-sm font-[500] text-black">
                    {token.symbol}
                  </span>
                  <span className="text-xs font-[500] text-[#909090]">
                    {formatNumber(token.balance, 4, true, {
                      round: 0,
                      isZeroPrecision: true
                    })}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-sm font-[500] text-black">
                      {usdDisplay}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
