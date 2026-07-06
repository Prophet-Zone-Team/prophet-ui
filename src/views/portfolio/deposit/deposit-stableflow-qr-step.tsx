"use client";

import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { SupportedChainOption } from "@/lib/funding/supported-assets";
import {
  STABLEFLOW_QR_MIN_DEPOSIT_USD,
  getStableflowChainOptions,
  getStableflowTokensForChain,
  sumStableflowChainBalanceUsd,
  type StableflowDepositToken,
} from "@/lib/funding/stableflow";
import { cn } from "@/lib/cn";
import {
  depositStableflowAddressBoxClass,
  depositStableflowAddressSkeletonClass,
  depositStableflowAddressTextClass,
  depositStableflowCopyButtonClass,
  depositStableflowQrMinLabelClass,
  depositStableflowQrSkeletonClass,
  depositStableflowQrWrapClass,
  depositTokenRowClass,
  depositTokenRowSelectedClass,
} from "@/views/portfolio/deposit/deposit-ui";
import { useDepositContext } from "@/views/portfolio/deposit/context";
import { FundingSelectorDropdown } from "@/views/portfolio/shared/funding-selector-dropdown";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";

export interface DepositStableflowQrStepProps {
  stableflowTokens: StableflowDepositToken[];
  selectedChain?: SupportedChainOption;
  selectedToken?: StableflowDepositToken;
  quoteLoading: boolean;
  tokensLoading: boolean;
  depositAddress?: string;
  mode?: "stableflow" | "direct_funder";
  onChainChange: (chain: SupportedChainOption) => void;
  onTokenChange: (token: StableflowDepositToken) => void;
}

export function DepositStableflowQrStep({
  stableflowTokens,
  selectedChain,
  selectedToken,
  quoteLoading,
  tokensLoading,
  depositAddress,
  mode = "stableflow",
  onChainChange,
  onTokenChange,
}: DepositStableflowQrStepProps) {
  const t = useTranslations("portfolio.deposit");
  const { getTokenUsdValue } = useDepositContext();
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);

  const chainOptions = useMemo(
    () => getStableflowChainOptions(stableflowTokens),
    [stableflowTokens],
  );

  const tokensForChain = useMemo(() => {
    if (!selectedChain) {
      return [];
    }

    return getStableflowTokensForChain(stableflowTokens, selectedChain.chainId);
  }, [selectedChain, stableflowTokens]);

  const isDirectFunder = mode === "direct_funder";
  const selectorsDisabled = isDirectFunder
    ? tokensLoading
    : quoteLoading || tokensLoading;
  const showQrSkeleton =
    !isDirectFunder && (quoteLoading || !depositAddress);
  const showAddressSkeleton =
    !isDirectFunder && (quoteLoading || !depositAddress);

  const handleCopyAddress = async () => {
    if (!depositAddress || showAddressSkeleton) {
      return;
    }

    try {
      await navigator.clipboard.writeText(depositAddress);
      toast.success(t("addressCopied"));
    } catch {
      toast.error(t("couldNotCopyAddress"));
    }
  };

  return (
    <div className="relative flex flex-col gap-5 pb-2">
      <div className="flex items-start gap-3">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          <FundingSelectorDropdown
            label={t("tokens")}
            triggerLabel={
              selectedToken?.symbol ??
              (tokensLoading ? t("loading") : t("selectToken"))
            }
            disabled={selectorsDisabled || tokensForChain.length === 0}
            open={tokenDropdownOpen}
            onOpenChange={(next) => {
              setTokenDropdownOpen(next);
              if (next) {
                setChainDropdownOpen(false);
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
                  className={cn(
                    depositTokenRowClass,
                    "w-full justify-between",
                    isSelected && depositTokenRowSelectedClass,
                  )}
                  onClick={() => {
                    onTokenChange(token);
                    setTokenDropdownOpen(false);
                  }}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <TokenIcon
                      symbol={token.symbol}
                      icon={token.icon}
                      size="sm"
                    />
                    <span className="text-sm font-[500] text-prophet-foreground">
                      {token.symbol}
                    </span>
                  </span>
                </button>
              );
            })}
          </FundingSelectorDropdown>

          <FundingSelectorDropdown
            label={t("chains")}
            triggerLabel={
              selectedChain?.chainName ??
              (tokensLoading ? t("loading") : t("selectChain"))
            }
            disabled={selectorsDisabled || chainOptions.length === 0}
            open={chainDropdownOpen}
            onOpenChange={(next) => {
              setChainDropdownOpen(next);
              if (next) {
                setTokenDropdownOpen(false);
              }
            }}
            triggerIcon={
              selectedChain ? (
                <TokenIcon
                  symbol="USDC"
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
              const chainUsd = sumStableflowChainBalanceUsd(
                stableflowTokens,
                chain.chainId,
                getTokenUsdValue,
              );

              return (
                <button
                  key={chain.chainId}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    depositTokenRowClass,
                    "w-full justify-between",
                    isSelected && depositTokenRowSelectedClass,
                  )}
                  onClick={() => {
                    onChainChange(chain);
                    setChainDropdownOpen(false);
                  }}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <TokenIcon
                      symbol="USDC"
                      chainLabel={chain.chainName}
                      chainIcon={chain.chainIcon}
                      size="sm"
                      chainOnly
                    />
                    <span className="text-sm font-[500] text-prophet-foreground">
                      {chain.chainName}
                    </span>
                  </span>
                </button>
              );
            })}
          </FundingSelectorDropdown>
        </div>

        <span
          className={cn(
            depositStableflowQrMinLabelClass,
            "flex shrink-0 items-center gap-1 pt-6",
          )}
        >
          {t("minLabel", { amount: `$${STABLEFLOW_QR_MIN_DEPOSIT_USD}` })}
        </span>
      </div>

      {showQrSkeleton ? (
        <div className={depositStableflowQrSkeletonClass} aria-hidden="true" />
      ) : depositAddress ? (
        <div className={depositStableflowQrWrapClass}>
          <QRCodeSVG
            value={depositAddress}
            size={200}
            level="M"
            marginSize={2}
            bgColor="#ffffff"
            fgColor="#000000"
          />
          {selectedChain ? (
            <img
              src={selectedChain.chainIcon}
              alt=""
              className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-prophet-panel bg-prophet-panel object-contain"
            />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-[500] text-prophet-foreground">{t("yourDepositAddress")}</span>
        <div className={depositStableflowAddressBoxClass}>
          {showAddressSkeleton ? (
            <div className={depositStableflowAddressSkeletonClass} aria-hidden="true" />
          ) : (
            <p className={depositStableflowAddressTextClass}>{depositAddress}</p>
          )}
          <button
            type="button"
            className={depositStableflowCopyButtonClass}
            disabled={showAddressSkeleton || !depositAddress}
            onClick={() => void handleCopyAddress()}
          >
            <img
              src="/icons/icon-copy.svg"
              alt=""
              className="size-3 shrink-0"
              aria-hidden="true"
            />
            {t("copyAddress")}
          </button>
        </div>
      </div>
    </div>
  );
}
