"use client";

import { cn } from "@/lib/cn";
import { formatNumber } from "@/utils";
import {
  depositTokenRowClass,
  depositTokenRowDisabledClass,
  depositTokenRowSelectedClass
} from "@/views/portfolio/deposit/deposit-ui";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";
import { useDepositContext } from "./context";
import type { DepositSelectableToken } from "./types";
import { getDefaultDepositTokenSortIndex, getEffectiveMinDepositUsd } from "./utils";
import { useMemo } from "react";
import Big from "big.js";
import { Loader2 } from "lucide-react";

export interface DepositTokenStepProps {
  selectedToken?: DepositSelectableToken;
  onSelectToken: (token: DepositSelectableToken) => void;
}

export function DepositTokenStep({
  selectedToken,
  onSelectToken
}: DepositTokenStepProps) {
  const {
    depositMethod,
    selectableTokens,
    getTokenBalance,
    getTokenUsdValue,
    hasTokenUsdPrice,
    balancesLoading,
    pricesLoading
  } = useDepositContext();

  const sortedSupportedAssets = useMemo(() => {
    return selectableTokens
      ?.map((asset) => {
        const token: DepositSelectableToken & {
          balance: string;
          usdValue: number;
          isLowBalance: boolean;
        } = {
          ...asset,
          balance: getTokenBalance(asset),
          usdValue: getTokenUsdValue(asset),
          isLowBalance: false
        };
        const minCheckoutUsd =
          depositMethod === "stableflow"
            ? 0
            : getEffectiveMinDepositUsd(token.minCheckoutUsd);
        token.isLowBalance =
          depositMethod !== "stableflow" &&
          Big(token.usdValue || 0).lt(minCheckoutUsd);
        return token;
      })
      .sort((a, b) => {
        if (balancesLoading) {
          const orderDiff =
            getDefaultDepositTokenSortIndex(a) -
            getDefaultDepositTokenSortIndex(b);
          if (orderDiff !== 0) {
            return orderDiff;
          }
          return a.symbol.localeCompare(b.symbol);
        }

        if (a.isLowBalance && !b.isLowBalance) {
          return 1;
        }
        if (!a.isLowBalance && b.isLowBalance) {
          return -1;
        }
        return b.usdValue - a.usdValue;
      });
  }, [
    balancesLoading,
    depositMethod,
    selectableTokens,
    getTokenBalance,
    getTokenUsdValue,
  ]);

  const loading = balancesLoading || pricesLoading;

  return (
    <div className="flex max-h-[340px] flex-col gap-0.5 overflow-y-auto pb-2">
      {sortedSupportedAssets?.map((token) => {
        const isSelected =
          selectedToken?.chainId === token.chainId &&
          selectedToken?.address === token.address;
        const isDisabled = false;
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
            disabled={isDisabled}
            className={cn(
              depositTokenRowClass,
              isSelected && depositTokenRowSelectedClass,
              isDisabled && depositTokenRowDisabledClass
            )}
            onClick={() => {
              if (!isDisabled) {
                onSelectToken(token);
              }
            }}
          >
            <TokenIcon
              symbol={token.symbol}
              chainLabel={token.chainName}
              icon={token.icon}
              chainIcon={token.chainIcon}
              dimmed={isDisabled}
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
              {isDisabled ? (
                <span className="text-sm font-[500] text-[#909090]">
                  Unsupported
                </span>
              ) : null}
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {token.isLowBalance && (
                    <span className="text-xs font-[500] text-[#FF674B] opacity-80">
                      Low balance
                    </span>
                  )}
                  <span className="text-sm font-[500] text-black">
                    {usdDisplay}
                  </span>
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
