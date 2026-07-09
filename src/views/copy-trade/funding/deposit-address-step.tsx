"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { FundingAsset } from "@/config/funding";
import { cn } from "@/lib/cn";
import type { CopyDepositChainOption } from "@/lib/copy-trade/deposit-assets";
import { useDarkModeEnabled } from "@/store";
import { formatNumber } from "@/utils";
import {
  depositStableflowAddressBoxClass,
  depositStableflowAddressSkeletonClass,
  depositStableflowAddressTextClass,
  depositStableflowCopyButtonClass,
  depositStableflowQrMinLabelClass,
  depositStableflowQrSkeletonClass,
  depositStableflowQrWrapClass,
} from "@/views/portfolio/deposit/deposit-ui";
import { FundingSelectorDropdown } from "@/views/portfolio/shared/funding-selector-dropdown";
import { TokenIcon } from "@/views/portfolio/shared/token-icon";

export interface DepositQrStepProps {
  chainOptions: CopyDepositChainOption[];
  tokensForChain: FundingAsset[];
  selectedChain: CopyDepositChainOption | null;
  selectedToken: FundingAsset | null;
  depositAddress: string;
  loading: boolean;
  assetsLoading: boolean;
  onChainChange: (chain: CopyDepositChainOption) => void;
  onTokenChange: (token: FundingAsset) => void;
}

const tokenRowClass = cn(
  "flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-prophet-action-panel",
);

export function DepositQrStep({
  chainOptions,
  tokensForChain,
  selectedChain,
  selectedToken,
  depositAddress,
  loading,
  assetsLoading,
  onChainChange,
  onTokenChange,
}: DepositQrStepProps) {
  const t = useTranslations("copyTrade.funding.deposit");
  const tPortfolioDeposit = useTranslations("portfolio.deposit");
  const darkModeEnabled = useDarkModeEnabled();
  const [chainOpen, setChainOpen] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);

  const showQrSkeleton = loading || !depositAddress;
  const minDepositUsd = selectedToken?.minCheckoutUsd ?? 0;

  const handleCopy = async () => {
    if (!depositAddress || showQrSkeleton) {
      return;
    }

    try {
      await navigator.clipboard.writeText(depositAddress);
      toast.success(tPortfolioDeposit("addressCopied"));
    } catch {
      toast.error(tPortfolioDeposit("couldNotCopyAddress"));
    }
  };

  return (
    <div className="relative flex flex-col gap-5 pb-2">
      <div className="relative flex items-start gap-3">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          <FundingSelectorDropdown
            label={t("network")}
            triggerLabel={
              selectedChain?.chainName ??
              (assetsLoading ? tPortfolioDeposit("loading") : t("selectNetwork"))
            }
            disabled={assetsLoading || loading || chainOptions.length === 0}
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
                  className={cn(tokenRowClass, isSelected && "bg-prophet-hover")}
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
                    <span className="text-sm font-[500] text-prophet-foreground">
                      {chain.chainName}
                    </span>
                  </span>
                </button>
              );
            })}
          </FundingSelectorDropdown>

          <FundingSelectorDropdown
            label={t("token")}
            triggerLabel={
              selectedToken?.symbol ??
              (assetsLoading ? tPortfolioDeposit("loading") : tPortfolioDeposit("selectToken"))
            }
            disabled={assetsLoading || loading || tokensForChain.length === 0}
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
                  className={cn(tokenRowClass, isSelected && "bg-prophet-hover")}
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
                    <span className="text-sm font-[500] text-prophet-foreground">
                      {token.symbol}
                    </span>
                  </span>
                </button>
              );
            })}
          </FundingSelectorDropdown>
        </div>
      </div>

      {showQrSkeleton ? (
        <div className={depositStableflowQrSkeletonClass} aria-hidden="true" />
      ) : (
        <div className={depositStableflowQrWrapClass}>
          <QRCodeSVG
            value={depositAddress}
            size={200}
            level="M"
            marginSize={2}
            bgColor={darkModeEnabled ? "#242427" : "#ffffff"}
            fgColor={darkModeEnabled ? "#ffffff" : "#000000"}
          />
          {selectedChain ? (
            <img
              src={selectedChain.chainIcon}
              alt=""
              className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-[8px] border-2 border-prophet-panel bg-prophet-panel object-contain"
            />
          ) : null}
        </div>
      )}

      {selectedToken && minDepositUsd > 0 ? (
        <p className="text-xs leading-5 text-prophet-muted">
          {t("qrMinDepositWarning", {
            amount: formatNumber(minDepositUsd, 2, true, { prefix: "$" }),
          })}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-[500] text-prophet-foreground">
          {tPortfolioDeposit("yourDepositAddress")}
        </span>
        <div className={depositStableflowAddressBoxClass}>
          {showQrSkeleton ? (
            <div className={depositStableflowAddressSkeletonClass} aria-hidden="true" />
          ) : (
            <p className={depositStableflowAddressTextClass}>{depositAddress}</p>
          )}
          <button
            type="button"
            className={depositStableflowCopyButtonClass}
            disabled={showQrSkeleton || !depositAddress}
            onClick={() => void handleCopy()}
          >
            <img
              src="/icons/icon-copy.svg"
              alt=""
              className="size-3 shrink-0"
              aria-hidden="true"
            />
            {tPortfolioDeposit("copyAddress")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Backward-compatible alias for any existing imports.
export { DepositQrStep as DepositAddressStep };
