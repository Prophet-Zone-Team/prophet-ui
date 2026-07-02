"use client";

import { useMemo, useState } from "react";
import Big from "big.js";
import { Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";
import { formatNumber } from "@/utils";
import {
  depositTokenRowClass,
  depositTokenRowDisabledClass,
  depositTokenRowSelectedClass,
  depositTokenSearchClearClass,
  depositTokenSearchEmptyClass,
  depositTokenSearchInputClass,
  depositTokenSearchWrapClass,
} from "@/views/portfolio/deposit/deposit-ui";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";
import { useDepositContext } from "./context";
import type { DepositSelectableToken } from "./types";
import {
  getDefaultDepositTokenSortIndex,
  getEffectiveMinDepositUsd,
  matchesDepositTokenSearch,
} from "./utils";

export interface DepositTokenStepProps {
  selectedToken?: DepositSelectableToken;
  onSelectToken: (token: DepositSelectableToken) => void;
}

export function DepositTokenStep({
  selectedToken,
  onSelectToken
}: DepositTokenStepProps) {
  const t = useTranslations("portfolio.deposit");
  const [searchQuery, setSearchQuery] = useState("");
  const {
    depositMethod,
    selectableTokens,
    getTokenBalance,
    getTokenUsdValue,
    hasTokenUsdPrice,
    balancesLoading,
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

  const filteredSupportedAssets = useMemo(() => {
    return sortedSupportedAssets?.filter((token) =>
      matchesDepositTokenSearch(token, searchQuery),
    );
  }, [searchQuery, sortedSupportedAssets]);

  const loading = balancesLoading;
  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col pb-2">
      <div className={depositTokenSearchWrapClass}>
        <Search className="size-[14px] shrink-0 text-prophet-foreground" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t("searchAssetsPlaceholder")}
          aria-label={t("searchAssetsAria")}
          className={depositTokenSearchInputClass}
        />
        {hasSearchQuery ? (
          <button
            type="button"
            className={depositTokenSearchClearClass}
            aria-label={t("clearSearch")}
            onClick={() => setSearchQuery("")}
          >
            <X className="size-2.5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="flex max-h-[340px] flex-col gap-0.5 overflow-y-auto">
        {filteredSupportedAssets?.length === 0 && hasSearchQuery ? (
          <div className={depositTokenSearchEmptyClass}>
            <p className="m-0">{t("noSearchResults")}</p>
          </div>
        ) : null}

        {filteredSupportedAssets?.map((token) => {
          const isSelected =
            selectedToken?.chainId === token.chainId &&
            selectedToken?.address === token.address;
          const isDisabled = false;
          const usdDisplay = depositMethod === "stableflow"
            ? formatNumber(token.usdValue, 2, true, {
              prefix: "$",
              round: 0,
              isZeroPrecision: true
            })
            : (
              token.usdValue > 0 || hasTokenUsdPrice(token.symbol)
                ? formatNumber(token.usdValue, 2, true, {
                  prefix: "$",
                  round: 0,
                  isZeroPrecision: true
                })
                : "--"
            );

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
                <span className="text-sm font-[500] text-prophet-foreground">
                  {token.symbol}
                </span>
                <span className="text-xs font-[500] text-prophet-muted">
                  {formatNumber(token.balance, 4, true, {
                    round: 0,
                    isZeroPrecision: true
                  })}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                {isDisabled ? (
                  <span className="text-sm font-[500] text-prophet-muted">
                    {t("unsupported")}
                  </span>
                ) : null}
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {token.isLowBalance && (
                      <span className="text-xs font-[500] text-[#FF674B] opacity-80">
                        {t("lowBalance")}
                      </span>
                    )}
                    <span className="text-sm font-[500] text-prophet-foreground">
                      {usdDisplay}
                    </span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
